import { auth, sheets } from 'googleapis/build/src/apis/sheets/index.js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import getMessage from '@/lib/getMessage';
import { prisma } from '@/lib/prisma';
import { getSiteSettings, type EditableSettings } from '@/lib/siteSettings';

interface RequestData {
  email: string;
  name: string;
  lang?: 'en' | 'tr';
}

const disableEmailSending = process.env.DISABLE_EMAIL_SENDING === 'true';
const resend = disableEmailSending
  ? null
  : new Resend(process.env.RESEND_API_KEY!);
const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

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
    const data: RequestData = await request.json();
    const { email, name, lang = 'en' } = data;
    const sheetId = getSheetId(type);

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const recentAttempt = await prisma.verificationCode.findFirst({
      where: { ip },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (recentAttempt && Date.now() - recentAttempt.createdAt.getTime() < 60000) {
      return NextResponse.json(
        {
          message:
            'You have sent a verification email recently. Please wait 60 seconds before trying again.',
        },
        { status: 429 }
      );
    }

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Invalid application type.' },
        { status: 400 }
      );
    }

    const authGoogle = new auth.GoogleAuth({
      credentials: SERVICE_ACCOUNT_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheetsClient = sheets({
      version: 'v4',
      auth: authGoogle,
    });

    const sheetResponse = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sayfa1!A:Z',
    });

    const values = sheetResponse.data.values || [];
    const emailExistsInSheet = values.some((row: string[]) =>
      row.some((cell) => cell && cell.toLowerCase() === email.toLowerCase())
    );

    if (emailExistsInSheet) {
      return NextResponse.json(
        { message: getMessage(lang, 'email_exists') },
        { status: 400 }
      );
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationCode.upsert({
      where: {
        email_applicationType: {
          email,
          applicationType: type,
        },
      },
      update: {
        code,
        expiresAt,
        ip,
        createdAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
        applicationType: type,
        ip,
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[application-test] type=${type} email=${email} verificationCode=${code}`);
    }

    if (disableEmailSending) {
      console.info(`[application-test] email sending disabled for type=${type}`);
    } else {
      await sendVerificationEmail(email, name, code, lang, type, settings.conference);
    }

    return NextResponse.json(
      {
        message: getMessage(lang, 'verification_email_sent'),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Apply Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
  lang: 'en' | 'tr',
  type: string,
  conference: EditableSettings['conference']
) {
  const fromEmail = conference.senderEmail.trim();
  const title = type.charAt(0).toUpperCase() + type.slice(1);
  const emailSubject =
    lang === 'en'
      ? `Verify Your ${conference.brandName} ${title} Application`
      : `${conference.brandName} ${title} Basvurusu Dogrulama`;

  const htmlContent =
    lang === 'en'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8c5847;">${conference.shortName} ${title} Application</h1>
        <p>Dear ${name},</p>
        <p>Thank you for applying!</p>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
          ${code}
        </div>
        <p>Best regards,<br/>${conference.brandName} Executive Team</p>
      </div>
    `
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8c5847;">${conference.shortName} ${title} Basvurusu</h1>
        <p>Sayin ${name},</p>
        <p>Basvurunuz icin tesekkurler!</p>
        <p>Dogrulama kodunuz:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
          ${code}
        </div>
        <p>Saygilarimizla,<br/>${conference.brandName} Executive Team</p>
      </div>
    `;

  if (!resend) return;

  const { error: resendError } = await resend.emails.send({
    from: `"${conference.brandName} Executive Team" <${fromEmail}>`,
    to: email,
    subject: emailSubject,
    html: htmlContent,
  });

  if (resendError) {
    console.error('Resend Email Error:', resendError);
  }
}
