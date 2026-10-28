import { DELEGATION_SHARED_FIELDS, type FormRules } from "@/lib/applicationSheetHeaders";
import type { QuestionDefinition } from "@/lib/questions";

export type AnswerValue = string | number | boolean | null | undefined;
export type AnswerValues = Record<string, AnswerValue>;
export type CompactAnswerValue = string | number | boolean;
export type CompactAnswers = Record<string, CompactAnswerValue>;

function isQuestionId(value: string) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value);
}

export function coerceAnswerValue(
  question: QuestionDefinition,
  value: AnswerValue
): CompactAnswerValue | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text) return undefined;

  if (question.type === "number") {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) return numeric;
  }

  return text;
}

export function compactAnswers(values: AnswerValues): CompactAnswers {
  const result: CompactAnswers = {};
  for (const [key, value] of Object.entries(values)) {
    if (!isQuestionId(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      const text = value.replace(/\r\n?/g, "\n").trim();
      if (!text) continue;
      result[key] = text;
      continue;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) result[key] = value;
      continue;
    }
    result[key] = value;
  }
  return result;
}

function questionValues(
  questions: QuestionDefinition[],
  values: AnswerValues,
  rules: FormRules
): CompactAnswers {
  const result: CompactAnswers = {};
  for (const question of questions) {
    if (question.id === "choice") {
      for (let index = 1; index <= rules.committeePreferenceCount; index += 1) {
        const value = coerceAnswerValue(question, values[`choice${index}`]);
        if (value !== undefined) result[`choice${index}`] = value;
      }
      continue;
    }
    const value = coerceAnswerValue(question, values[question.id]);
    if (value !== undefined) result[question.id] = value;
  }
  return result;
}

export function buildIndividualAnswers(
  questions: QuestionDefinition[],
  values: AnswerValues,
  rules: FormRules
): CompactAnswers {
  return questionValues(questions, values, rules);
}

export function buildDelegationAnswers(
  questions: QuestionDefinition[],
  summary: AnswerValues,
  delegates: AnswerValues[],
  rules: FormRules
): { summary: CompactAnswers; delegates: CompactAnswers[] } {
  const sharedSummaryIds = new Set<string>(DELEGATION_SHARED_FIELDS.map(({ summaryId }) => summaryId));
  const sharedDelegateIds = new Set<string>(DELEGATION_SHARED_FIELDS.map(({ delegateId }) => delegateId));

  const summaryValues: AnswerValues = {};
  for (const { summaryId } of DELEGATION_SHARED_FIELDS) {
    summaryValues[summaryId] = summary[summaryId];
  }
  for (const question of questions) {
    if (sharedSummaryIds.has(question.id) || sharedDelegateIds.has(question.id)) continue;
    if (question.id === "choice" || question.id.startsWith("delegate")) continue;
    summaryValues[question.id] = summary[question.id];
  }

  const delegateQuestions = questions.filter((question) => !sharedSummaryIds.has(question.id));
  const summaryQuestions = questions.filter((question) =>
    Object.prototype.hasOwnProperty.call(summaryValues, question.id)
  );

  return {
    summary: questionValues(summaryQuestions, summaryValues, rules),
    delegates: delegates.map((delegate) => questionValues(delegateQuestions, delegate, rules)),
  };
}
