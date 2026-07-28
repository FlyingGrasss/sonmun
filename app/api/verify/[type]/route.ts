// app/api/verify/[type]/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
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

const auth = new google.auth.GoogleAuth({
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

    const questionMap = settings.questions[type] ?? {};
    const hasQuestion = (key: string) => Object.prototype.hasOwnProperty.call(questionMap, key);
    const add = (row: (string | number | undefined)[], key: string, value: string | number | undefined) => {
      if (hasQuestion(key)) row.push(value);
    };
    const addChoices = (row: (string | number | undefined)[], choices?: string[]) => {
      if (!hasQuestion('choice')) return;
      for (let index = 0; index < settings.form.committeePreferenceCount; index += 1) row.push(choices?.[index] || '');
    };
    let values: (string | number | undefined)[][] = [];

    if (type === 'delegation') {
      const summary: (string | number | undefined)[] = [];
      add(summary, 'schoolName', formData.school);
      add(summary, 'numberOfDelegates', formData.numberOfDelegates);
      add(summary, 'contactEmail', email);
      values.push(summary);
      if (Array.isArray(formData.delegates)) {
        formData.delegates.forEach((delegate) => {
          const row: (string | number | undefined)[] = [];
          add(row, 'delegateFullName', delegate.fullName);
          add(row, 'delegateBirthDate', delegate.birthDate);
          add(row, 'delegateNationalId', delegate.nationalId);
          add(row, 'delegateGender', delegate.gender);
          addChoices(row, delegate.committeePreferences);
          add(row, 'delegateEnglishLevel', delegate.englishLevel);
          add(row, 'delegateDietaryPreferences', delegate.dietaryPreferences);
          add(row, 'delegateEmail', delegate.email);
          add(row, 'delegatePhoneNumber', delegate.phoneNumber);
          add(row, 'delegateCity', delegate.city);
          add(row, 'delegateGrade', delegate.grade);
          add(row, 'delegateExperience', delegate.experience);
          add(row, 'delegateMotivationLetter', delegate.motivationLetter);
          add(row, 'delegateAdditionalInfo', delegate.additionalInfo);
          values.push(row);
        });
      }
    } else {
      const row: (string | number | undefined)[] = [];
      add(row, 'fullName', formData.fullName);
      add(row, 'email', email);
      add(row, 'phoneNumber', formData.phoneNumber);
      add(row, 'nationalId', formData.nationalId);
      add(row, 'birthDate', formData.birthDate);
      add(row, 'gender', formData.gender);
      add(row, 'school', formData.school);
      add(row, 'city', formData.city);
      add(row, 'grade', formData.grade);
      if (type === 'delegate') {
        add(row, 'englishLevel', formData.englishLevel);
        addChoices(row, formData.committeePreferences);
        add(row, 'experience', formData.experience);
        add(row, 'motivationLetter', formData.motivationLetter);
      } else if (type === 'press') {
        add(row, 'experience', formData.experience);
        add(row, 'motivationLetter', formData.motivationLetter);
        add(row, 'camera', formData.camera);
      } else if (type === 'chair') {
        add(row, 'englishLevel', formData.englishLevel || 'N/A');
        addChoices(row, formData.committeePreferences);
        add(row, 'experience', formData.experience);
        add(row, 'references', formData.references);
        add(row, 'motivationLetter', formData.motivationLetter);
        add(row, 'chairAnswer1', formData.chairAnswer1 || '');
        add(row, 'chairAnswer3', formData.chairAnswer3 || '');
        add(row, 'chairAnswer2', formData.chairAnswer2 || '');
      } else {
        add(row, 'experience', formData.experience);
        add(row, 'motivationLetter', formData.motivationLetter);
      }
      add(row, 'dietaryPreferences', formData.dietaryPreferences);
      add(row, 'additionalInfo', formData.additionalInfo);
      values = [row];
    }

    if (values[0] && formData.customAnswers) values[0].push(...Object.values(formData.customAnswers));

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
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
