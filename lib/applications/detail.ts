import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { toApplicationListItem } from "@/lib/applications/query";
import type { ApplicationDetail, ApplicationEmailLogView, ApplicationStatus, ApplicationType } from "@/lib/applications/types";
import { humanizeKey } from "@/lib/applications/format";

export async function getApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  const [application, settings] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        emailLogs: {
          orderBy: { sentAt: "desc" },
          take: 20,
        },
      },
    }),
    getSiteSettings(),
  ]);

  if (!application) return null;

  const applicationType = application.applicationType as ApplicationType;
  const applicationTitle =
    settings.applications.find((item) => item.id === applicationType)?.title ?? humanizeKey(applicationType);

  const emailLogs: ApplicationEmailLogView[] = application.emailLogs.map((log) => ({
    id: log.id,
    templateKey: log.templateKey,
    recipient: log.recipient,
    subject: log.subject,
    status: log.status,
    error: log.error,
    sentAt: log.sentAt.toISOString(),
  }));

  return {
    ...toApplicationListItem(application),
    status: application.status as ApplicationStatus,
    notes: application.notes,
    answers: application.answers,
    questions: settings.questions[applicationType] ?? [],
    applicationTitle,
    updatedAt: application.updatedAt.toISOString(),
    emailLogs,
  };
}
