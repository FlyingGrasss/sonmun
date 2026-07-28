// app/api/verify/[type]/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import getMessage from '@/lib/getMessage';

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
  chairAnswer1?: string;
  chairAnswer2?: string;
  chairAnswer3?: string;
  dietaryPreferences?: string;
  additionalInfo?: string;
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

    let values: (string | number | undefined)[][] = [];

    if (type === 'delegation') {
      if (Array.isArray(formData.delegates)) {
        // 1. Add the Delegation Header Row
        values.push([
          formData.school, // Column 1: School Name
          formData.numberOfDelegates, // Column 2: Delegate Count
          email // Column 3: Advisor/delegation Email
        ]);

        // 2. Add each Delegate Row
        formData.delegates.forEach((d) => {
          values.push([
            d.fullName, // 1: Delegate Full Name
            d.birthDate, // 2: Birth Date
            d.nationalId, // 3: TC
            d.gender, // 4: Gender
            d.committeePreferences?.[0] || '', // 5: Committee 1
            d.committeePreferences?.[1] || '', // 6: Committee 2
            d.committeePreferences?.[2] || '', // 7: Committee 3
            d.englishLevel, // 8: English Level
            d.dietaryPreferences, // 9: Diet
            d.email, // 10: Email
            d.phoneNumber, // 11: Phone Number
            d.city, // 12: City
            d.grade, // 13: Grade
            d.experience, // 14: Experience
            d.motivationLetter, // 15: Motivation Letter
            d.additionalInfo // 16: Additional Info
          ]);
        });
      }
    } else {
      const base = [
        formData.fullName,
        email,
        formData.phoneNumber,
        formData.nationalId,
        formData.birthDate,
        formData.gender,
        formData.school,
        formData.city,
        formData.grade
      ];

      let specifics: (string | undefined)[] = [];

      if (type === 'delegate') {
        specifics = [
          formData.englishLevel,
          formData.committeePreferences?.[0] || '',
          formData.committeePreferences?.[1] || '',
          formData.committeePreferences?.[2] || '',
          formData.experience,
          formData.motivationLetter
        ];
      } else if (type === 'press') {
        specifics = [
          formData.experience,
          formData.motivationLetter,
          formData.camera
        ];
      } else if (type === 'chair') {
        specifics = [
          formData.englishLevel || 'N/A',
          formData.committeePreferences?.[0] || '',
          formData.committeePreferences?.[1] || '',
          formData.committeePreferences?.[2] || '',
          formData.experience,
          formData.motivationLetter,
          formData.chairAnswer1 || '', // GA Question
          formData.chairAnswer3 || '', // Crisis Directive Question
          formData.chairAnswer2 || '' // Procedure Question
        ];
      } else {
        specifics = [
          formData.experience,
          formData.motivationLetter
        ];
      }

      const footer = [
        formData.dietaryPreferences,
        formData.additionalInfo
      ];

      values = [[...base, ...specifics, ...footer]];
    }

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
