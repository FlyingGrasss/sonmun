import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getApplicationSheetColumns } from "@/lib/applicationSheetHeaders";
import { getSiteSettings } from "@/lib/siteSettings";
import { fetchSheetRows } from "@/lib/applications/sheets";
import { parseSheetRows } from "@/lib/applications/sheetParsing";
import type { ApplicationType, SyncApplicationTypeResult } from "@/lib/applications/types";

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function emptyResult(type: ApplicationType, error: string): SyncApplicationTypeResult {
  return {
    ok: false,
    type,
    fetchedRows: 0,
    headerMatched: false,
    parsed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    warnings: [],
    error,
  };
}

export async function syncApplicationType(type: ApplicationType): Promise<SyncApplicationTypeResult> {
  try {
    const settings = await getSiteSettings();
    const columns = getApplicationSheetColumns(settings.questions, settings.form)[type] ?? [];
    const questions = settings.questions[type] ?? [];
    const rows = await fetchSheetRows(type);
    const parsed = parseSheetRows({
      applicationType: type,
      columns,
      rows,
      questions,
      rules: settings.form,
    });

    const unsafeHeader =
      !parsed.headerMatched ||
      parsed.warnings.some((warning) => warning.includes("matched by position"));
    if (unsafeHeader) {
      return {
        ok: false,
        type,
        fetchedRows: rows.length,
        headerMatched: parsed.headerMatched,
        parsed: parsed.applications.length,
        created: 0,
        updated: 0,
        unchanged: 0,
        skipped: parsed.skippedRowCount,
        warnings: [
          ...parsed.warnings,
          "No rows were written because the sheet header could not be matched safely.",
        ],
        error: "The sheet header does not match the current form. No rows were imported.",
      };
    }

    const existing = await prisma.application.findMany({
      where: { applicationType: type },
      select: { id: true, sourceKey: true, sourceHash: true },
    });
    const existingByKey = new Map(existing.map((row) => [row.sourceKey, row]));

    const creates = parsed.applications.filter((application) => !existingByKey.has(application.sourceKey));
    const updates = parsed.applications.filter((application) => {
      const row = existingByKey.get(application.sourceKey);
      return Boolean(row && row.sourceHash !== application.sourceHash);
    });

    for (const chunk of chunks(creates, 50)) {
      await prisma.application.createMany({
        data: chunk.map((application) => ({
          sourceKey: application.sourceKey,
          sourceHash: application.sourceHash,
          applicationType: application.applicationType,
          fullName: application.fullName,
          email: application.email,
          phone: application.phone,
          school: application.school,
          answers: toJson(application.answers),
          appliedAt: application.appliedAt,
        })),
        skipDuplicates: true,
      });
    }

    for (const chunk of chunks(updates, 10)) {
      await Promise.all(
        chunk.map((application) =>
          prisma.application.update({
            where: { sourceKey: application.sourceKey },
            data: {
              sourceHash: application.sourceHash,
              fullName: application.fullName,
              email: application.email,
              phone: application.phone,
              school: application.school,
              answers: toJson(application.answers),
            },
          })
        )
      );
    }

    return {
      ok: true,
      type,
      fetchedRows: rows.length,
      headerMatched: parsed.headerMatched,
      parsed: parsed.applications.length,
      created: creates.length,
      updated: updates.length,
      unchanged: parsed.applications.length - creates.length - updates.length,
      skipped: parsed.skippedRowCount,
      warnings: parsed.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "SHEET_NOT_CONFIGURED") {
      return emptyResult(type, "This application sheet is not configured.");
    }
    if (message === "SHEET_CREDENTIALS_INVALID") {
      return emptyResult(type, "The Google service account credentials are invalid.");
    }
    console.error("[applications:sync]", { type, message: message.slice(0, 200) });
    return emptyResult(type, "The sheet could not be synced. Check the server logs and sheet access.");
  }
}
