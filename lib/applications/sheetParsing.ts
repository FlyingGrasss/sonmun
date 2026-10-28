import type { ApplicationSheetColumn } from "@/lib/applicationSheetHeaders";
import type { QuestionDefinition } from "@/lib/questions";
import type { ApplicationType } from "@/lib/applications/types";
import {
  buildDelegationAnswers,
  buildIndividualAnswers,
  compactAnswers,
  type AnswerValues,
} from "@/lib/applications/answers";
import { applicationContentHash, applicationSourceKey, dedupeApplicationKeys } from "@/lib/applications/keys";
import { isValidEmail, normalizeEmail } from "@/lib/applications/validation";

export type ParsedApplication = {
  sourceKey: string;
  sourceHash: string;
  applicationType: ApplicationType;
  fullName: string;
  email: string;
  phone: string | null;
  school: string | null;
  answers: Record<string, unknown>;
  appliedAt: Date | null;
};

export type ColumnMapping = {
  column: ApplicationSheetColumn;
  sheetIndex: number;
};

export type SheetSide = "individual" | "summary" | "delegate";

function rowHasValues(row: string[]) {
  return row.some((cell) => String(cell ?? "").trim() !== "");
}

export function normalizeHeaderLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitHeaderRow(row: string[]) {
  if (row.length === 1 && row[0].includes("\t")) return row[0].split("\t");
  return row;
}

function tokens(value: string) {
  return new Set(normalizeHeaderLabel(value).split(" ").filter((token) => token.length > 1));
}

function tokenSimilarity(first: string, second: string) {
  const firstTokens = tokens(first);
  const secondTokens = tokens(second);
  if (firstTokens.size === 0 || secondTokens.size === 0) return 0;
  let shared = 0;
  for (const token of firstTokens) {
    if (secondTokens.has(token)) shared += 1;
  }
  return shared / Math.max(firstTokens.size, secondTokens.size);
}

export function mapSheetColumns(
  columns: ApplicationSheetColumn[],
  headerRow: string[]
): { mapping: ColumnMapping[]; warnings: string[]; matched: boolean } {
  const normalizedHeaders = headerRow.map((cell) => normalizeHeaderLabel(String(cell ?? "")));
  const used = new Set<number>();
  const mapping: ColumnMapping[] = [];
  const warnings: string[] = [];

  const findIndex = (column: ApplicationSheetColumn) => {
    const target = normalizeHeaderLabel(column.header);
    if (!target) return -1;

    const exact = normalizedHeaders.findIndex((header, index) => header === target && !used.has(index));
    if (exact >= 0) return exact;

    const contains = normalizedHeaders.findIndex(
      (header, index) =>
        !used.has(index) &&
        header.length > 3 &&
        target.length > 3 &&
        (header.includes(target) || target.includes(header))
    );
    if (contains >= 0) return contains;

    let bestIndex = -1;
    let bestScore = 0;
    normalizedHeaders.forEach((header, index) => {
      if (used.has(index)) return;
      const score = tokenSimilarity(column.header, header);
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestIndex;
  };

  for (const column of columns) {
    const index = findIndex(column);
    if (index >= 0) {
      used.add(index);
      mapping.push({ column, sheetIndex: index });
    }
  }

  const matchRate = columns.length > 0 ? mapping.length / columns.length : 0;
  if (matchRate < 0.5) {
    warnings.push("The sheet header did not match the current form definition; columns were read by position.");
    return {
      mapping: columns.map((column, index) => ({ column, sheetIndex: index })),
      warnings,
      matched: false,
    };
  }

  for (const [index, column] of columns.entries()) {
    if (mapping.some((entry) => entry.column === column)) continue;
    if (index < headerRow.length && !used.has(index)) {
      used.add(index);
      mapping.push({ column, sheetIndex: index });
      warnings.push(`Column "${column.header}" was matched by position; verify the sheet header.`);
      continue;
    }
    warnings.push(`Column "${column.header}" was not found in the sheet and was skipped.`);
  }

  mapping.sort((first, second) => first.sheetIndex - second.sheetIndex);
  return { mapping, warnings, matched: true };
}

export function valuesFromSheetRow(
  mapping: ColumnMapping[],
  row: string[],
  side: SheetSide
): AnswerValues {
  const values: AnswerValues = {};
  for (const { column, sheetIndex } of mapping) {
    const value = row[sheetIndex] ?? "";
    if (column.summaryKey && column.delegateKey) {
      if (side === "summary") values[column.summaryKey] = value;
      else if (side === "delegate") values[column.delegateKey] = value;
      else if (column.individualKey) values[column.individualKey] = value;
      continue;
    }
    if (side === "individual" && column.individualKey) values[column.individualKey] = value;
    else if (side === "summary" && column.summaryKey) values[column.summaryKey] = value;
    else if (side === "delegate" && column.delegateKey) values[column.delegateKey] = value;
  }
  return values;
}

function parseTimestamp(headerRow: string[], row: string[]) {
  const timestampLabels = new Set(["submitted at", "timestamp", "date", "applied at", "submission date"]);
  const index = headerRow.findIndex((cell) => timestampLabels.has(normalizeHeaderLabel(cell)));
  if (index < 0) return null;
  const value = String(row[index] ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function firstNonEmptyIndex(rows: string[][]) {
  return rows.findIndex(rowHasValues);
}

export function parseSheetRows(input: {
  applicationType: ApplicationType;
  columns: ApplicationSheetColumn[];
  rows: string[][];
  questions: QuestionDefinition[];
  rules: { minimumDelegates: number; committeePreferenceCount: number };
}): {
  applications: ParsedApplication[];
  warnings: string[];
  headerMatched: boolean;
  dataRowCount: number;
  skippedRowCount: number;
} {
  const { applicationType, columns, rows, questions, rules } = input;
  const headerIndex = firstNonEmptyIndex(rows);
  if (headerIndex < 0) {
    return {
      applications: [],
      warnings: ["The sheet is empty."],
      headerMatched: false,
      dataRowCount: 0,
      skippedRowCount: 0,
    };
  }

  const candidateHeader = splitHeaderRow(rows[headerIndex]);
  let header = candidateHeader;
  let dataRows = rows.slice(headerIndex + 1);
  let headerMatched = true;

  const candidateMapping = mapSheetColumns(columns, candidateHeader);
  if (!candidateMapping.matched && candidateHeader.some((cell) => isValidEmail(String(cell ?? "")))) {
    header = [];
    dataRows = rows.slice(headerIndex);
    headerMatched = false;
  }

  const { mapping, warnings, matched } = mapSheetColumns(columns, header);
  headerMatched = headerMatched && matched;

  const applications: ParsedApplication[] = [];
  let skippedRowCount = 0;

  if (applicationType === "delegation") {
    type DelegationGroup = { summary: AnswerValues; delegates: AnswerValues[]; startRow: number };
    let current: DelegationGroup | null = null;
    const groups: DelegationGroup[] = [];

    dataRows.forEach((row, index) => {
      if (!rowHasValues(row)) return;
      const sheetRowNumber = headerIndex + (header.length > 0 ? 2 : 1) + index;
      const summaryValues = valuesFromSheetRow(mapping, row, "summary");
      const declared = String(summaryValues.numberOfDelegates ?? "").trim();
      const contactEmail = String(summaryValues.contactEmail ?? "").trim();
      const isSummary = /^\d{1,3}$/.test(declared) && isValidEmail(contactEmail);

      if (isSummary) {
        if (current) groups.push(current);
        current = { summary: summaryValues, delegates: [], startRow: sheetRowNumber };
        return;
      }

      if (!current) current = { summary: {}, delegates: [], startRow: sheetRowNumber };
      current.delegates.push(valuesFromSheetRow(mapping, row, "delegate"));
    });

    if (current) groups.push(current);

    for (const group of groups) {
      const summary = compactAnswers(group.summary);
      const delegates = group.delegates
        .map((delegate) => compactAnswers(delegate))
        .filter((delegate) => Object.keys(delegate).length > 0);
      const email = normalizeEmail(String(summary.contactEmail ?? delegates[0]?.delegateEmail ?? ""));
      if (!isValidEmail(email)) {
        skippedRowCount += Math.max(1, delegates.length);
        warnings.push(`Delegation starting at row ${group.startRow}: missing or invalid contact email; skipped.`);
        continue;
      }

      const school = String(summary.schoolName ?? "").trim() || null;
      const fullName = school || `Delegation (${email})`;
      const answers = buildDelegationAnswers(questions, summary, delegates, rules);
      const declared = Number(summary.numberOfDelegates);
      if (Number.isFinite(declared) && declared !== delegates.length) {
        warnings.push(
          `Delegation "${school ?? email}" declares ${declared} delegates but ${delegates.length} rows were found; all rows were kept.`
        );
      }

      applications.push({
        sourceKey: applicationSourceKey("delegation", { email, school }),
        sourceHash: applicationContentHash({ fullName, email, phone: null, school, answers }),
        applicationType: "delegation",
        fullName,
        email,
        phone: null,
        school,
        answers,
        appliedAt: null,
      });
    }
  } else {
    dataRows.forEach((row, index) => {
      if (!rowHasValues(row)) return;
      const sheetRowNumber = headerIndex + (header.length > 0 ? 2 : 1) + index;
      const values = valuesFromSheetRow(mapping, row, "individual");
      const email = normalizeEmail(String(values.email ?? ""));
      if (!isValidEmail(email)) {
        skippedRowCount += 1;
        warnings.push(`Row ${sheetRowNumber}: missing or invalid email; skipped.`);
        return;
      }

      const answers = buildIndividualAnswers(questions, values, rules);
      const fullName = String(answers.fullName ?? values.fullName ?? "").trim() || email.split("@")[0];
      const phone = String(answers.phoneNumber ?? "").trim() || null;
      const school = String(answers.school ?? "").trim() || null;

      applications.push({
        sourceKey: applicationSourceKey(applicationType, { email, school }),
        sourceHash: applicationContentHash({ fullName, email, phone, school, answers }),
        applicationType,
        fullName,
        email,
        phone,
        school,
        answers,
        appliedAt: parseTimestamp(header, row),
      });
    });
  }

  const deduped = dedupeApplicationKeys(applications);

  return {
    applications: deduped.items,
    warnings: [...warnings, ...deduped.warnings],
    headerMatched,
    dataRowCount: dataRows.filter(rowHasValues).length,
    skippedRowCount,
  };
}
