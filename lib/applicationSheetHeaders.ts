import { isInternalQuestionKey, type QuestionDefinition, type QuestionGroups } from "@/lib/questions";

export type FormRules = {
  minimumDelegates: number;
  committeePreferenceCount: number;
};

export type SheetHeaderRow = {
  applicationType: string;
  text: string;
};

export const DELEGATION_SHARED_FIELDS = [
  { summaryId: "schoolName", delegateId: "delegateFullName" },
  { summaryId: "numberOfDelegates", delegateId: "delegateBirthDate" },
  { summaryId: "contactEmail", delegateId: "delegateNationalId" },
] as const;

function questionMap(questions: QuestionGroups, type: string) {
  return new Map((questions[type] ?? []).map((question) => [question.id, question]));
}

function labelsForQuestions(questions: QuestionDefinition[], rules: FormRules) {
  const labels: string[] = [];
  for (const question of questions) {
    if (!question.label || isInternalQuestionKey(question.id)) continue;
    if (question.id === "choice") {
      for (let index = 1; index <= rules.committeePreferenceCount; index += 1) labels.push(`${index}. ${question.label}`);
    } else {
      labels.push(question.label);
    }
  }
  return labels;
}

function labelFor(map: Map<string, QuestionDefinition>, id: string, fallback = "") {
  return map.get(id)?.label || fallback;
}

export function getApplicationSheetHeaders(questions: QuestionGroups, rules: FormRules): SheetHeaderRow[] {
  const rows: SheetHeaderRow[] = [];
  const delegationMap = questionMap(questions, "delegation");
  const delegation = DELEGATION_SHARED_FIELDS.map(({ summaryId, delegateId }) => {
    const summaryLabel = labelFor(delegationMap, summaryId);
    const delegateLabel = labelFor(delegationMap, delegateId);
    return summaryLabel && delegateLabel ? `${summaryLabel} / ${delegateLabel}` : summaryLabel || delegateLabel;
  });
  const remainingDelegation = (questions.delegation ?? [])
    .filter((question) => !DELEGATION_SHARED_FIELDS.some(({ summaryId, delegateId }) => question.id === summaryId || question.id === delegateId))
    .flatMap((question) => question.id === "choice"
      ? Array.from({ length: rules.committeePreferenceCount }, (_, index) => `${index + 1}. ${question.label}`)
      : [question.label]);
  rows.push({ applicationType: "Delegation", text: [...delegation, ...remainingDelegation].filter(Boolean).join("\t") });

  for (const type of ["delegate", "chair", "press", "admin"]) {
    rows.push({
      applicationType: type[0].toUpperCase() + type.slice(1),
      text: labelsForQuestions(questions[type] ?? [], rules).join("\t"),
    });
  }

  return rows;
}
