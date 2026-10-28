"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { syncApplicationType } from "@/lib/applications/sync";
import { getApplicationDetail } from "@/lib/applications/detail";
import { sendBulkStatusEmails, sendCustomEmail, sendStatusEmail } from "@/lib/applications/send";
import { saveEmailTemplates } from "@/lib/applications/templateStore";
import {
  cleanMultiLine,
  cleanSingleLine,
  isApplicationStatus,
  isApplicationType,
  isValidApplicationId,
  isValidRequestId,
  normalizeIds,
} from "@/lib/applications/validation";
import type {
  ActionResult,
  ApplicationDetail,
  ApplicationStatus,
  ApplicationType,
  BulkUpdateResult,
  EmailTemplateInput,
  SendBatchResult,
  SyncApplicationTypeResult,
  UnsentTarget,
} from "@/lib/applications/types";
import { parseApplicationFilters } from "@/lib/applications/filters";
import { buildApplicationOrderBy, buildApplicationWhere } from "@/lib/applications/query";
import type { Prisma } from "@/lib/generated/prisma/client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function revalidateApplications() {
  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}

export async function syncApplicationsAction(
  type: unknown
): Promise<
  | { ok: true; summary: SyncApplicationTypeResult }
  | { ok: false; type: ApplicationType | null; error: string }
> {
  await requireAdmin();
  if (!isApplicationType(type)) {
    return { ok: false, type: null, error: "Unknown application type." };
  }

  const summary = await syncApplicationType(type);
  revalidateApplications();
  return { ok: true, summary };
}

export async function getApplicationDetailAction(id: unknown): Promise<ApplicationDetail | null> {
  await requireAdmin();
  if (!isValidApplicationId(id)) return null;
  return getApplicationDetail(id);
}

export async function updateApplicationAction(id: unknown, patch: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidApplicationId(id)) return { ok: false, error: "Invalid application." };
  if (!isRecord(patch)) return { ok: false, error: "No changes were provided." };

  const data: {
    status?: ApplicationStatus;
    statusEmailSent?: boolean;
    givenCommittee?: string | null;
    allocation?: string | null;
    notes?: string | null;
  } = {};

  if (patch.status !== undefined) {
    if (!isApplicationStatus(patch.status)) return { ok: false, error: "Invalid status." };
    const current = await prisma.application.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { ok: false, error: "Application not found." };
    data.status = patch.status;
    if (current.status !== patch.status) data.statusEmailSent = false;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "givenCommittee")) {
    data.givenCommittee = cleanSingleLine(patch.givenCommittee, 120) || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "allocation")) {
    data.allocation = cleanSingleLine(patch.allocation, 120) || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "notes")) {
    data.notes = cleanMultiLine(patch.notes, 5000) || null;
  }

  if (Object.keys(data).length === 0) return { ok: true };

  try {
    await prisma.application.update({ where: { id }, data });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return { ok: false, error: "Application not found." };
    }
    throw error;
  }
  revalidateApplications();
  return { ok: true };
}

export async function bulkUpdateStatusAction(
  ids: unknown,
  status: unknown
): Promise<BulkUpdateResult> {
  await requireAdmin();
  const normalized = normalizeIds(ids, 100);
  if (!normalized) return { ok: false, error: "Select between 1 and 100 applications." };
  if (!isApplicationStatus(status)) return { ok: false, error: "Invalid status." };

  const result = await prisma.application.updateMany({
    where: { id: { in: normalized }, status: { not: status } },
    data: { status, statusEmailSent: false },
  });
  revalidateApplications();
  return { ok: true, updated: result.count, requested: normalized.length };
}

export async function saveEmailTemplatesAction(templates: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!isRecord(templates)) return { ok: false, error: "Invalid template data." };

  const input = {} as EmailTemplateInput;
  for (const statusKey of ["accepted", "waitlisted", "denied"] as const) {
    const value = templates[statusKey];
    if (!isRecord(value)) return { ok: false, error: "All three templates are required." };
    const subject = cleanSingleLine(value.subject, 200);
    const body = cleanMultiLine(value.body, 10_000);
    if (!subject) return { ok: false, error: "Each template needs a subject." };
    if (!body) return { ok: false, error: "Each template needs a message body." };
    input[statusKey] = { subject, body };
  }

  await saveEmailTemplates(input);
  revalidateApplications();
  return { ok: true };
}

export async function sendStatusEmailAction(
  input: unknown
): Promise<{ ok: true; result: SendBatchResult } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isRecord(input)) return { ok: false, error: "Invalid email request." };
  if (!isValidApplicationId(input.applicationId)) return { ok: false, error: "Invalid application." };
  if (!isValidRequestId(input.requestId)) return { ok: false, error: "Invalid send request." };

  const result = await sendStatusEmail({
    applicationId: input.applicationId,
    requestId: input.requestId,
  });
  revalidateApplications();
  return { ok: true, result };
}

export async function sendBulkStatusEmailsAction(
  input: unknown
): Promise<{ ok: true; result: SendBatchResult } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isRecord(input)) return { ok: false, error: "Invalid email request." };
  const applicationIds = normalizeIds(input.applicationIds, 20);
  if (!applicationIds) return { ok: false, error: "Send between 1 and 20 applications per batch." };
  if (!isValidRequestId(input.requestId)) return { ok: false, error: "Invalid send request." };
  const mode = input.mode === "unsent" ? "unsent" : input.mode === "selected" ? "selected" : null;
  if (!mode) return { ok: false, error: "Invalid send mode." };

  const result = await sendBulkStatusEmails({
    applicationIds,
    requestId: input.requestId,
    mode,
  });
  revalidateApplications();
  return { ok: true, result };
}

export async function getUnsentTargetsAction(
  filters: unknown
): Promise<{ ok: true; targets: UnsentTarget[]; total: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = parseApplicationFilters(
    isRecord(filters) ? (filters as Record<string, string | string[] | undefined>) : {}
  );
  const where: Prisma.ApplicationWhereInput = buildApplicationWhere({
    ...parsed,
    emailStatus: "not_sent",
  });
  if (parsed.status === "all") where.status = { not: "pending" };

  const [rows, total] = await Promise.all([
    prisma.application.findMany({
      where,
      select: { id: true, fullName: true, email: true, status: true },
      orderBy: buildApplicationOrderBy(),
      take: 500,
    }),
    prisma.application.count({ where }),
  ]);

  return {
    ok: true,
    targets: rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      status: row.status as ApplicationStatus,
    })),
    total,
  };
}

export async function sendCustomEmailAction(
  input: unknown
): Promise<{ ok: true; result: SendBatchResult } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isRecord(input)) return { ok: false, error: "Invalid email request." };
  if (!isValidApplicationId(input.applicationId)) return { ok: false, error: "Invalid application." };
  if (!isValidRequestId(input.requestId)) return { ok: false, error: "Invalid send request." };
  const subject = cleanSingleLine(input.subject, 200);
  const body = cleanMultiLine(input.body, 10_000);
  if (!subject) return { ok: false, error: "A subject is required." };
  if (!body) return { ok: false, error: "A message body is required." };

  const result = await sendCustomEmail({
    applicationId: input.applicationId,
    subject,
    body,
    requestId: input.requestId,
  });
  revalidateApplications();
  return { ok: true, result };
}
