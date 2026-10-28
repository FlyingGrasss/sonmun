import { prisma } from "@/lib/prisma";
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailConference,
} from "@/lib/applications/emailTemplates";
import { EMAIL_STATUS_KEYS, type EmailStatusKey, type EmailTemplateView } from "@/lib/applications/types";

export type EmailTemplateRecord = {
  statusKey: EmailStatusKey;
  subject: string;
  body: string;
  updatedAt: Date | null;
};

export async function getEmailTemplates(): Promise<Record<EmailStatusKey, EmailTemplateRecord>> {
  const stored = await prisma.emailTemplate.findMany({
    where: { statusKey: { in: [...EMAIL_STATUS_KEYS] } },
  });
  const byKey = new Map(stored.map((row) => [row.statusKey, row]));

  return Object.fromEntries(
    EMAIL_STATUS_KEYS.map((statusKey) => {
      const row = byKey.get(statusKey);
      return [
        statusKey,
        {
          statusKey,
          subject: row?.subject ?? DEFAULT_EMAIL_TEMPLATES[statusKey].subject,
          body: row?.body ?? DEFAULT_EMAIL_TEMPLATES[statusKey].body,
          updatedAt: row?.updatedAt ?? null,
        } satisfies EmailTemplateRecord,
      ];
    })
  ) as Record<EmailStatusKey, EmailTemplateRecord>;
}

export async function getEmailTemplateViews(): Promise<EmailTemplateView[]> {
  const templates = await getEmailTemplates();
  return EMAIL_STATUS_KEYS.map((statusKey) => {
    const template = templates[statusKey];
    return {
      statusKey,
      subject: template.subject,
      body: template.body,
      updatedAt: template.updatedAt?.toISOString() ?? null,
      isDefault: template.updatedAt === null,
    };
  });
}

export async function getTemplateForStatus(statusKey: EmailStatusKey) {
  const template = await prisma.emailTemplate.findUnique({ where: { statusKey } });
  return template
    ? { subject: template.subject, body: template.body }
    : { ...DEFAULT_EMAIL_TEMPLATES[statusKey] };
}

export async function saveEmailTemplates(input: Record<EmailStatusKey, { subject: string; body: string }>) {
  await prisma.$transaction(
    EMAIL_STATUS_KEYS.map((statusKey) =>
      prisma.emailTemplate.upsert({
        where: { statusKey },
        update: { subject: input[statusKey].subject, body: input[statusKey].body },
        create: { statusKey, subject: input[statusKey].subject, body: input[statusKey].body },
      })
    )
  );
}

export function conferenceFromSettings(settings: {
  conference: {
    brandName: string;
    displayName: string;
    shortName: string;
    dates: string;
    location: { city: string; country: string };
    siteUrl: string;
    senderEmail: string;
  };
}): EmailConference {
  return {
    brandName: settings.conference.brandName,
    displayName: settings.conference.displayName,
    shortName: settings.conference.shortName,
    dates: settings.conference.dates,
    location: settings.conference.location,
    siteUrl: settings.conference.siteUrl,
    senderEmail: settings.conference.senderEmail,
  };
}
