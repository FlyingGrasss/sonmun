export const QUESTION_TYPES = [
  { value: "shortText", label: "Short text (input)" },
  { value: "longText", label: "Long text (textarea)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "phone", label: "Phone" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export type QuestionDefinition = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder: string;
  options: string[];
  minWords: number;
  minCharacters: number;
};

export type QuestionGroups = Record<string, QuestionDefinition[]>;

type QuestionRules = {
  minimumMotivationWords: number;
  minimumDelegates: number;
  committeePreferenceCount: number;
};

const DEFAULT_OPTIONS: Record<string, string[]> = {
  gender: ["Male", "Female", "Other"],
  grade: ["Preparation Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade", "Graduate"],
  englishLevel: ["Beginner", "Intermediate", "Advanced", "Native"],
  dietaryPreferences: ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free"],
};

const LEGACY_ORDER: Record<string, string[]> = {
  delegate: ["fullName", "email", "phoneNumber", "nationalId", "birthDate", "gender", "school", "city", "grade", "englishLevel", "choice", "experience", "motivationLetter", "dietaryPreferences", "additionalInfo"],
  chair: ["fullName", "email", "phoneNumber", "nationalId", "birthDate", "gender", "school", "city", "grade", "englishLevel", "choice", "experience", "motivationLetter", "references", "chairAnswer1", "chairAnswer3", "chairAnswer2", "dietaryPreferences", "additionalInfo"],
  press: ["fullName", "email", "phoneNumber", "nationalId", "birthDate", "gender", "school", "city", "grade", "experience", "motivationLetter", "camera", "dietaryPreferences", "additionalInfo"],
  admin: ["fullName", "email", "phoneNumber", "nationalId", "birthDate", "gender", "school", "city", "grade", "experience", "motivationLetter", "dietaryPreferences", "additionalInfo"],
  delegation: ["schoolName", "numberOfDelegates", "contactEmail", "delegateFullName", "delegateBirthDate", "delegateNationalId", "delegateGender", "choice", "delegateEnglishLevel", "delegateDietaryPreferences", "delegateEmail", "delegatePhoneNumber", "delegateCity", "delegateGrade", "delegateExperience", "delegateMotivationLetter", "delegateAdditionalInfo"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferQuestionType(key: string, label: string): QuestionType {
  const value = `${key} ${label}`.toLowerCase();
  if (value.includes("birthdate") || value.includes("birth date")) return "date";
  if (value.includes("phone")) return "phone";
  if (value.includes("numberofdelegates") || value.includes("number of delegates")) return "number";
  if (value.includes("gender") || value.includes("grade") || value.includes("english level") || value.includes("dietary") || value.includes("choice") || value.includes("committee preference")) return "dropdown";
  if (value.includes("motivation") || value.includes("experience") || value.includes("additional") || value.includes("reference") || value.includes("answer") || value.includes("directive") || value.includes("resolution") || value.includes("motion")) return "longText";
  return "shortText";
}

function cleanQuestionText(value: string, rules: QuestionRules): string {
  return value
    .replaceAll("{minimumMotivationWords}", String(rules.minimumMotivationWords))
    .replaceAll("{minimumDelegates}", String(rules.minimumDelegates))
    .replaceAll("{committeePreferenceCount}", String(rules.committeePreferenceCount))
    .replace(/#?\s*\{number\}/g, "")
    .replace(/\s*\*\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/^\s*[.:-]\s*/, "")
    .replace(/\s+#$/, "")
    .trim();
}

function isQuestionType(value: unknown): value is QuestionType {
  return QUESTION_TYPES.some((option) => option.value === value);
}

function defaultOptionsFor(id: string) {
  const normalizedId = id.replace(/^delegate/, "").replace(/^contact/, "").toLowerCase();
  const optionKey = {
    gender: "gender",
    grade: "grade",
    englishlevel: "englishLevel",
    dietarypreferences: "dietaryPreferences",
  }[normalizedId];
  return optionKey ? [...DEFAULT_OPTIONS[optionKey]] : [];
}

export function normalizeQuestionDefinition(
  value: unknown,
  key: string,
  rules: QuestionRules
): QuestionDefinition {
  const source = isRecord(value) ? value : {};
  const legacyLabel = typeof value === "string" ? value : typeof source.label === "string" ? source.label : "";
  const id = typeof source.id === "string" && source.id.trim() ? source.id.trim() : key;
  const label = cleanQuestionText(legacyLabel, rules);
  const explicitRequired = typeof source.required === "boolean" ? source.required : null;
  const required = explicitRequired ?? /\*/.test(legacyLabel);
  const type = isQuestionType(source.type) ? source.type : inferQuestionType(id, legacyLabel);
  const placeholder = typeof source.placeholder === "string" ? cleanQuestionText(source.placeholder, rules) : "";
  const options = Array.isArray(source.options)
    ? source.options.filter((option): option is string => typeof option === "string").map((option) => option.trim()).filter(Boolean)
    : [];
  const minWords = typeof source.minWords === "number" && Number.isFinite(source.minWords)
    ? Math.max(0, Math.floor(source.minWords))
    : 0;
  const minCharacters = typeof source.minCharacters === "number" && Number.isFinite(source.minCharacters)
    ? Math.max(0, Math.floor(source.minCharacters))
    : 0;

  return {
    id,
    label,
    type,
    required,
    placeholder,
    options: options.length > 0 ? options : type === "dropdown" ? defaultOptionsFor(id) : [],
    minWords,
    minCharacters,
  };
}

function normalizeGroup(value: unknown, type: string, rules: QuestionRules): QuestionDefinition[] {
  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((question, index) => [isRecord(question) && typeof question.id === "string" ? question.id : `question${index + 1}`, question])
    : isRecord(value)
      ? Object.entries(value)
      : [];
  const isLegacyRecord = !Array.isArray(value);
  const legacyOrder = LEGACY_ORDER[type] ?? [];
  const orderedEntries = isLegacyRecord
    ? entries.sort(([first], [second]) => {
        const firstIndex = legacyOrder.indexOf(first);
        const secondIndex = legacyOrder.indexOf(second);
        return (firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex < 0 ? Number.MAX_SAFE_INTEGER : secondIndex);
      })
    : entries;
  const seen = new Set<string>();
  const hasSchoolQuestion = orderedEntries.some(([key]) => key === "school");

  return orderedEntries
    .map(([key, question]) => normalizeQuestionDefinition(question, key, rules))
    .filter((question) => {
      if (!question.label || seen.has(question.id)) return false;
      if (isInternalQuestionKey(question.id)) return false;
      if (type !== "delegation" && question.id === "schoolName" && hasSchoolQuestion) return false;
      seen.add(question.id);
      return true;
    });
}

export function normalizeQuestionGroups(
  value: unknown,
  rules: QuestionRules,
  fallback?: unknown
): QuestionGroups {
  const source = isRecord(value) ? value : {};
  const fallbackGroups = isRecord(fallback) ? fallback : {};
  const types = new Set([...Object.keys(fallbackGroups), ...Object.keys(source)]);

  return Object.fromEntries(
    [...types].map((type) => {
      const groupValue = Object.prototype.hasOwnProperty.call(source, type) ? source[type] : fallbackGroups[type];
      return [type, normalizeGroup(groupValue, type, rules)];
    })
  );
}

export function isInternalQuestionKey(key: string) {
  return key === "delegate" || key === "committeePreferences" || /MotivationLetterPlaceholder$/i.test(key);
}

export function questionById(questions: QuestionDefinition[], id: string) {
  return questions.find((question) => question.id === id);
}

export function questionLabel(
  questions: QuestionDefinition[],
  key: string,
  fallback = ""
) {
  return questionById(questions, key)?.label || fallback;
}
