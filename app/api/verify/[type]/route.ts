// app/api/verify/[type]/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth, sheets } from 'googleapis/build/src/apis/sheets/index.js';
import getMessage from '@/lib/getMessage';
import { getSiteSettings } from '@/lib/siteSettings';

type DelegateMember = {
  fullName?: string;
  birthDate?: string;
  nationalId?: string;
  gender?: string;
  committeePreferences?: string[];
  englishLevel?: string;
  dietaryPreferences?: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  grade?: string;
  experience?: string;
  motivationLetter?: string;
  references?: string;
  additionalInfo?: string;
};

type ApplicationPayload = {
  email: string;
  code: string;
  lang?: 'en' | 'tr';
  fullName?: string;
  phoneNumber?: string;
  nationalId?: string;
  birthDate?: string;
  gender?: string;
  school?: string;
  city?: string;
  grade?: string;
  englishLevel?: string;
  committeePreferences?: string[];
  experience?: string;
  motivationLetter?: string;
  camera?: string;
  references?: string;
  chairAnswer1?: string;
  chairAnswer2?: string;
  chairAnswer3?: string;
  dietaryPreferences?: string;
  additionalInfo?: string;
  customAnswers?: Record<string, string>;
  numberOfDelegates?: number;
  delegates?: DelegateMember[];
};

const googleAuth = new auth.GoogleAuth({
  credentials: JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  ),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

const getSheetId = (type: string) => {
  switch (type) {
    case 'delegate':
      return process.env.GOOGLE_SHEET_ID_DELEGATE;
    case 'press':
      return process.env.GOOGLE_SHEET_ID_PRESS;
    case 'chair':
      return process.env.GOOGLE_SHEET_ID_CHAIR;
    case 'admin':
      return process.env.GOOGLE_SHEET_ID_ADMIN;
    case 'delegation':
      return process.env.GOOGLE_SHEET_ID_DELEGATION;
    default:
      return null;
  }
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const settings = await getSiteSettings();
    if (!settings.applications.some((application) => application.id === type && application.enabled)) {
      return NextResponse.json({ error: 'This application is currently closed.' }, { status: 404 });
    }
    const data = (await request.json()) as ApplicationPayload;
    const { email, code, lang = 'en', ...formData } = data;
    const sheetId = getSheetId(type);

    if (!sheetId)
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );

    const codeData = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        applicationType: type,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!codeData) {
      return NextResponse.json(
        { message: getMessage(lang, 'invalid_code') },
        { status: 400 }
      );
    }

    const questionDefinitions = settings.questions[type] ?? [];
    const questionIds = new Set(questionDefinitions.map((question) => question.id));
    const addOrderedValues = (
      row: (string | number | undefined)[],
      values: Record<string, string | number | undefined>,
      skip = new Set<string>()
    ) => {
      for (const question of questionDefinitions) {
        if (skip.has(question.id)) continue;
        if (question.id === 'choice') {
          for (let index = 0; index < settings.form.committeePreferenceCount; index += 1) row.push(values[`choice${index + 1}`] ?? '');
        } else {
          row.push(values[question.id] ?? '');
        }
      }
    };
    const mainValues: Record<string, string | number | undefined> = {
      ...Object.fromEntries(Object.entries(formData).filter(([key]) => key !== 'customAnswers')),
      email,
      ...(formData.customAnswers ?? {}),
    };
    const mainQuestionValues: Record<string, string | number | undefined> = {
      ...mainValues,
      schoolName: formData.school,
      contactEmail: email,
      choice1: formData.committeePreferences?.[0],
      choice2: formData.committeePreferences?.[1],
      choice3: formData.committeePreferences?.[2],
    };
    const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
    const validateQuestionLimit = (question: typeof questionDefinitions[number], value: string | number | undefined) => {
      const text = String(value ?? '').trim();
      if (!text) return null;
      const minimumWords = question.minWords > 0
        ? question.minWords
        : 0;
      if (question.minCharacters > 0 && text.length < question.minCharacters) {
        return `${question.label} must be at least ${question.minCharacters} characters.`;
      }
      if (minimumWords > 0 && wordCount(text) < minimumWords) {
        return `${question.label} must be at least ${minimumWords} words.`;
      }
      return null;
    };
    for (const question of questionDefinitions) {
      const error = validateQuestionLimit(question, mainQuestionValues[question.id]);
      if (error) return NextResponse.json({ error }, { status: 400 });
    }
    const delegateValues = (delegate: DelegateMember): Record<string, string | number | undefined> => ({
      delegateFullName: delegate.fullName,
      delegateBirthDate: delegate.birthDate,
      delegateNationalId: delegate.nationalId,
      delegateGender: delegate.gender,
      choice1: delegate.committeePreferences?.[0],
      choice2: delegate.committeePreferences?.[1],
      choice3: delegate.committeePreferences?.[2],
      delegateEnglishLevel: delegate.englishLevel,
      delegateDietaryPreferences: delegate.dietaryPreferences,
      delegateEmail: delegate.email,
      delegatePhoneNumber: delegate.phoneNumber,
      delegateGrade: delegate.grade,
      delegateExperience: delegate.experience,
      delegateMotivationLetter: delegate.motivationLetter,
      delegateReferences: delegate.references,
      delegateAdditionalInfo: delegate.additionalInfo,
    });
    let values: (string | number | undefined)[][] = [];

    if (type === 'delegation') {
      const summary: (string | number | undefined)[] = [];
      addOrderedValues(summary, {
        schoolName: formData.school,
        numberOfDelegates: formData.numberOfDelegates,
        contactEmail: email,
        ...(formData.customAnswers ?? {}),
      }, new Set(questionDefinitions.filter((question) => question.id.startsWith('delegate') || question.id.startsWith('choice') || question.id === 'choice').map((question) => question.id)));
      values.push(summary);
      if (Array.isArray(formData.delegates)) {
        for (const delegate of formData.delegates) {
          for (const question of questionDefinitions) {
            const error = validateQuestionLimit(question, delegateValues(delegate)[question.id]);
            if (error) return NextResponse.json({ error }, { status: 400 });
          }
        }
        formData.delegates.forEach((delegate) => {
          const row: (string | number | undefined)[] = [];
          addOrderedValues(row, delegateValues(delegate), new Set(['schoolName', 'numberOfDelegates', 'contactEmail']));
          values.push(row);
        });
      }
    } else {
      const row: (string | number | undefined)[] = [];
      if (questionIds.has('choice1')) {
        mainValues.choice1 = formData.committeePreferences?.[0];
        mainValues.choice2 = formData.committeePreferences?.[1];
        mainValues.choice3 = formData.committeePreferences?.[2];
      }
      if (questionIds.has('choice') && !questionIds.has('choice1')) {
        mainValues.choice1 = formData.committeePreferences?.[0];
        mainValues.choice2 = formData.committeePreferences?.[1];
        mainValues.choice3 = formData.committeePreferences?.[2];
      }
      addOrderedValues(row, mainValues);
      values = [row];
    }

    const sheetsClient = sheets({ version: 'v4', auth: googleAuth });
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sayfa1!A:Z',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    return NextResponse.json(
      {
        message: getMessage(lang, 'verification_successful')
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
