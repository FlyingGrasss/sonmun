import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import {
  buildCustomEmail,
  buildStatusEmail,
  type ApplicationEmailTarget,
} from "@/lib/applications/emailTemplates";
import { sendApplicationEmail } from "@/lib/applications/email";
import {
  conferenceFromSettings,
  getEmailTemplates,
} from "@/lib/applications/templateStore";
import { isEmailStatusKey } from "@/lib/applications/validation";
import type {
  ApplicationType,
  EmailStatusKey,
  SendBatchResult,
  SendMode,
  SendOneResult,
} from "@/lib/applications/types";

const SEND_SPACING_MS = 550;

const applicationEmailSelect = {
  id: true,
  fullName: true,
  email: true,
  applicationType: true,
  school: true,
  givenCommittee: true,
  allocation: true,
  status: true,
  statusEmailSent: true,
} as const;

type ApplicationEmailRow = {
  id: string;
  fullName: string;
  email: string;
  applicationType: string;
  school: string | null;
  givenCommittee: string | null;
  allocation: string | null;
  status: string;
  statusEmailSent: boolean;
};

function toTarget(row: ApplicationEmailRow): ApplicationEmailTarget {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    applicationType: row.applicationType as ApplicationType,
    school: row.school,
    givenCommittee: row.givenCommittee,
    allocation: row.allocation,
  };
}

function titleFor(settings: Awaited<ReturnType<typeof getSiteSettings>>, type: string) {
  return settings.applications.find((application) => application.id === type)?.title;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function markStatusEmailSent(applicationId: string, statusKey: EmailStatusKey) {
  await prisma.application.updateMany({
    where: { id: applicationId, status: statusKey },
    data: {
      lastEmailSentAt: new Date(),
      lastEmailStatus: statusKey,
      statusEmailSent: true,
    },
  });
}

async function recordEmail(input: {
  applicationId: string;
  templateKey: string | null;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "simulated";
  resendId: string | null;
  error?: string;
  updateStatusKey?: EmailStatusKey;
}): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.applicationEmailLog.create({
          data: {
            applicationId: input.applicationId,
            templateKey: input.templateKey,
            recipient: input.recipient,
            subject: input.subject,
            status: input.status,
            resendId: input.resendId,
            error: input.error?.slice(0, 500) ?? null,
          },
        });
        if (input.updateStatusKey) {
          await tx.application.updateMany({
            where: { id: input.applicationId, status: input.updateStatusKey },
            data: {
              lastEmailSentAt: new Date(),
              lastEmailStatus: input.updateStatusKey,
              statusEmailSent: true,
            },
          });
        }
      });
      return true;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") {
        if (input.updateStatusKey) {
          await markStatusEmailSent(input.applicationId, input.updateStatusKey).catch(() => undefined);
        }
        return true;
      }
      if (attempt === 2) {
        console.error("[applications:email-log]", { applicationId: input.applicationId, code });
        return false;
      }
      await delay(150);
    }
  }
  return false;
}

async function sendStatusRows(
  rows: ApplicationEmailRow[],
  requestId: string,
  mode: SendMode
): Promise<SendBatchResult> {
  if (rows.length === 0) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      simulated: 0,
      skipped: 0,
      results: [],
      error: "No applications selected.",
    };
  }

  const [settings, templates] = await Promise.all([getSiteSettings(), getEmailTemplates()]);
  const conference = conferenceFromSettings(settings);
  const results: SendOneResult[] = [];
  let sent = 0;
  let failed = 0;
  let simulated = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    if (mode === "unsent" && (row.statusEmailSent || row.status === "pending")) {
      skipped += 1;
      results.push({
        applicationId: row.id,
        fullName: row.fullName,
        email: row.email,
        ok: true,
        skipped: true,
        warning:
          row.status === "pending"
            ? "Status is still pending; skipped."
            : "The status email was already sent; skipped.",
      });
      continue;
    }

    const statusKey = isEmailStatusKey(row.status) ? row.status : null;
    if (!statusKey) {
      failed += 1;
      results.push({
        applicationId: row.id,
        fullName: row.fullName,
        email: row.email,
        ok: false,
        error: "Set a final status before sending a status email.",
      });
      continue;
    }

    const email = buildStatusEmail({
      application: toTarget(row),
      statusKey,
      template: templates[statusKey],
      conference,
      applicationTitle: titleFor(settings, row.applicationType),
    });

    const response = await sendApplicationEmail({
      applicationId: row.id,
      statusKey,
      to: row.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      senderEmail: conference.senderEmail,
      senderName: conference.brandName,
      requestId,
    });

    if (response.ok) {
      const logged = await recordEmail({
        applicationId: row.id,
        templateKey: statusKey,
        recipient: row.email,
        subject: email.subject,
        status: response.simulated ? "simulated" : "sent",
        resendId: response.resendId,
        updateStatusKey: response.simulated ? undefined : statusKey,
      });
      if (response.simulated) simulated += 1;
      else sent += 1;
      results.push({
        applicationId: row.id,
        fullName: row.fullName,
        email: row.email,
        ok: true,
        simulated: response.simulated,
        warning: !logged
          ? "Email sent, but the history log could not be saved. Do not resend; check the email provider."
          : response.simulated
            ? "Email sending is disabled; this was simulated."
            : undefined,
      });
    } else {
      failed += 1;
      await recordEmail({
        applicationId: row.id,
        templateKey: statusKey,
        recipient: row.email,
        subject: email.subject,
        status: "failed",
        resendId: null,
        error: response.error,
      });
      results.push({
        applicationId: row.id,
        fullName: row.fullName,
        email: row.email,
        ok: false,
        error: response.error,
      });
    }

    if (index < rows.length - 1) await delay(SEND_SPACING_MS);
  }

  return { ok: failed === 0, sent, failed, simulated, skipped, results };
}

export async function sendStatusEmail(input: {
  applicationId: string;
  requestId: string;
}): Promise<SendBatchResult> {
  const row = await prisma.application.findUnique({
    where: { id: input.applicationId },
    select: applicationEmailSelect,
  });
  if (!row) {
    return {
      ok: false,
      sent: 0,
      failed: 1,
      simulated: 0,
      skipped: 0,
      results: [],
      error: "Application not found.",
    };
  }
  return sendStatusRows([row], input.requestId, "selected");
}

export async function sendBulkStatusEmails(input: {
  applicationIds: string[];
  requestId: string;
  mode: SendMode;
}): Promise<SendBatchResult> {
  const rows = await prisma.application.findMany({
    where: { id: { in: input.applicationIds } },
    select: applicationEmailSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = input.applicationIds
    .map((id) => byId.get(id))
    .filter((row): row is ApplicationEmailRow => Boolean(row));
  return sendStatusRows(ordered, input.requestId, input.mode);
}

export async function sendCustomEmail(input: {
  applicationId: string;
  subject: string;
  body: string;
  requestId: string;
}): Promise<SendBatchResult> {
  const row = await prisma.application.findUnique({
    where: { id: input.applicationId },
    select: applicationEmailSelect,
  });
  if (!row) {
    return {
      ok: false,
      sent: 0,
      failed: 1,
      simulated: 0,
      skipped: 0,
      results: [],
      error: "Application not found.",
    };
  }

  const settings = await getSiteSettings();
  const conference = conferenceFromSettings(settings);
  const email = buildCustomEmail({
    application: toTarget(row),
    subject: input.subject,
    body: input.body,
    conference,
    applicationTitle: titleFor(settings, row.applicationType),
  });

  const response = await sendApplicationEmail({
    applicationId: row.id,
    statusKey: "custom",
    to: row.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    senderEmail: conference.senderEmail,
    senderName: conference.brandName,
    requestId: input.requestId,
  });

  if (response.ok) {
    const logged = await recordEmail({
      applicationId: row.id,
      templateKey: "custom",
      recipient: row.email,
      subject: email.subject,
      status: response.simulated ? "simulated" : "sent",
      resendId: response.resendId,
    });
    return {
      ok: true,
      sent: response.simulated ? 0 : 1,
      failed: 0,
      simulated: response.simulated ? 1 : 0,
      skipped: 0,
      results: [
        {
          applicationId: row.id,
          fullName: row.fullName,
          email: row.email,
          ok: true,
          simulated: response.simulated,
          warning: !logged
            ? "Email sent, but the history log could not be saved. Do not resend; check the email provider."
            : response.simulated
              ? "Email sending is disabled; this was simulated."
              : undefined,
        },
      ],
    };
  }

  await recordEmail({
    applicationId: row.id,
    templateKey: "custom",
    recipient: row.email,
    subject: email.subject,
    status: "failed",
    resendId: null,
    error: response.error,
  });

  return {
    ok: false,
    sent: 0,
    failed: 1,
    simulated: 0,
    skipped: 0,
    results: [
      {
        applicationId: row.id,
        fullName: row.fullName,
        email: row.email,
        ok: false,
        error: response.error,
      },
    ],
    error: response.error,
  };
}
