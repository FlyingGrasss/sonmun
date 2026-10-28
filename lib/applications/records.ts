import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApplicationType } from "@/lib/applications/types";

export type SubmissionRecord = {
  sourceKey: string;
  sourceHash: string;
  applicationType: ApplicationType;
  fullName: string;
  email: string;
  phone: string | null;
  school: string | null;
  answers: Record<string, unknown>;
  appliedAt: Date;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export async function upsertApplicationFromSubmission(record: SubmissionRecord) {
  await prisma.application.upsert({
    where: { sourceKey: record.sourceKey },
    update: {
      sourceHash: record.sourceHash,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      school: record.school,
      answers: toJson(record.answers),
    },
    create: {
      sourceKey: record.sourceKey,
      sourceHash: record.sourceHash,
      applicationType: record.applicationType,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      school: record.school,
      answers: toJson(record.answers),
      appliedAt: record.appliedAt,
    },
  });
}
