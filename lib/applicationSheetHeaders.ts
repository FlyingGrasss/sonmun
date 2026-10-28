import { isInternalQuestionKey, type QuestionDefinition, type QuestionGroups } from "@/lib/questions";

export type FormRules = {
  minimumDelegates: number;
  committeePreferenceCount: number;
};

export type SheetHeaderRow = {
  applicationType: string;
  text: string;
};

export type ApplicationSheetColumn = {
  header: string;
  questionId?: string;
  individualKey?: string;
  summaryKey?: string;
  delegateKey?: string;
};

export const DELEGATION_SHARED_FIELDS = [
  { summaryId: "schoolName", delegateId: "delegateFullName" },
  { summaryId: "numberOfDelegates", delegateId: "delegateBirthDate" },
  { summaryId: "contactEmail", delegateId: "delegateNationalId" },
] as const;

function questionMap(questions: QuestionGroups, type: string) {
  return new Map((questions[type] ?? []).map((question) => [question.id, question]));
}

function labelFor(map: Map<string, QuestionDefinition>, id: string, fallback = "") {
  return map.get(id)?.label || fallback;
}

export function getApplicationSheetColumns(
  questions: QuestionGroups,
  rules: FormRules
): Record<string, ApplicationSheetColumn[]> {
  const delegationMap = questionMap(questions, "delegation");
  const delegationColumns: ApplicationSheetColumn[] = [];

  for (const { summaryId, delegateId } of DELEGATION_SHARED_FIELDS) {
    const summaryLabel = labelFor(delegationMap, summaryId);
    const delegateLabel = labelFor(delegationMap, delegateId);
    const header = summaryLabel && delegateLabel ? `${summaryLabel} / ${delegateLabel}` : summaryLabel || delegateLabel;
    if (!header) continue;
    delegationColumns.push({ header, summaryKey: summaryId, delegateKey: delegateId });
  }

  const sharedIds = new Set<string>(
    DELEGATION_SHARED_FIELDS.flatMap(({ summaryId, delegateId }) => [summaryId, delegateId])
  );
  for (const question of questions.delegation ?? []) {
    if (!question.label || isInternalQuestionKey(question.id) || sharedIds.has(question.id)) continue;
    if (question.id === "choice") {
      for (let index = 1; index <= rules.committeePreferenceCount; index += 1) {
        delegationColumns.push({
          header: `${index}. ${question.label}`,
          questionId: "choice",
          delegateKey: `choice${index}`,
        });
      }
      continue;
    }
    delegationColumns.push({
      header: question.label,
      questionId: question.id,
      delegateKey: question.id,
    });
  }

  const result: Record<string, ApplicationSheetColumn[]> = { delegation: delegationColumns };

  for (const type of ["delegate", "chair", "press", "admin"]) {
    const columns: ApplicationSheetColumn[] = [];
    for (const question of questions[type] ?? []) {
      if (!question.label || isInternalQuestionKey(question.id)) continue;
      if (question.id === "choice") {
        for (let index = 1; index <= rules.committeePreferenceCount; index += 1) {
          columns.push({
            header: `${index}. ${question.label}`,
            questionId: "choice",
            individualKey: `choice${index}`,
          });
        }
        continue;
      }
      columns.push({
        header: question.label,
        questionId: question.id,
        individualKey: question.id,
      });
    }
    result[type] = columns;
  }

  return result;
}

export function getApplicationSheetHeaders(questions: QuestionGroups, rules: FormRules): SheetHeaderRow[] {
  const columns = getApplicationSheetColumns(questions, rules);
  return [
    { applicationType: "Delegation", text: columns.delegation.map((column) => column.header).join("\t") },
    ...["delegate", "chair", "press", "admin"].map((type) => ({
      applicationType: type[0].toUpperCase() + type.slice(1),
      text: (columns[type] ?? []).map((column) => column.header).join("\t"),
    })),
  ];
}
