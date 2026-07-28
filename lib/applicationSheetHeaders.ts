export type QuestionGroups = Record<string, Record<string, string>>;

type FormRules = {
  minimumMotivationWords: number;
  minimumDelegates: number;
  committeePreferenceCount: number;
};

export type SheetHeaderRow = {
  applicationType: string;
  text: string;
};

function format(value: string, rules: FormRules, number?: number) {
  return value
    .replaceAll("{minimumMotivationWords}", String(rules.minimumMotivationWords))
    .replaceAll("{minimumDelegates}", String(rules.minimumDelegates))
    .replaceAll("{committeePreferenceCount}", String(rules.committeePreferenceCount))
    .replaceAll("{number}", String(number ?? "{number}"));
}

export function getApplicationSheetHeaders(questions: QuestionGroups, rules: FormRules): SheetHeaderRow[] {
  const get = (type: string, key: string, number?: number) => {
    const value = questions[type]?.[key];
    return typeof value === "string" ? format(value, rules, number) : null;
  };
  const add = (headers: string[], type: string, key: string, number?: number) => {
    const value = get(type, key, number);
    if (value !== null) headers.push(value);
  };
  const addCustom = (headers: string[], type: string, knownKeys: string[]) => {
    for (const key of Object.keys(questions[type] ?? {})) {
      if (!knownKeys.includes(key)) add(headers, type, key);
    }
  };
  const choices = (headers: string[], type: string, key = "choice") => {
    for (let index = 1; index <= rules.committeePreferenceCount; index += 1) add(headers, type, key, index);
  };

  const rows: SheetHeaderRow[] = [];

  const delegation: string[] = [];
  const combine = (first: string, second: string) => {
    const firstValue = get("delegation", first);
    const secondValue = get("delegation", second);
    if (firstValue !== null && secondValue !== null) delegation.push(`${firstValue} / ${secondValue}`);
    else if (firstValue !== null) delegation.push(firstValue);
    else if (secondValue !== null) delegation.push(secondValue);
  };
  combine("schoolName", "delegateFullName");
  combine("numberOfDelegates", "delegateBirthDate");
  combine("contactEmail", "delegateNationalId");
  add(delegation, "delegation", "delegateGender");
  choices(delegation, "delegation");
  add(delegation, "delegation", "delegateEnglishLevel");
  add(delegation, "delegation", "delegateDietaryPreferences");
  add(delegation, "delegation", "delegateEmail");
  add(delegation, "delegation", "delegatePhoneNumber");
  add(delegation, "delegation", "delegateCity");
  add(delegation, "delegation", "delegateGrade");
  add(delegation, "delegation", "delegateExperience");
  add(delegation, "delegation", "delegateMotivationLetter");
  add(delegation, "delegation", "delegateAdditionalInfo");
  addCustom(delegation, "delegation", [
    "schoolName", "delegateFullName", "numberOfDelegates", "delegateBirthDate", "contactEmail", "delegateNationalId", "delegateGender", "choice", "delegateEnglishLevel", "delegateDietaryPreferences", "delegateEmail", "delegatePhoneNumber", "delegateCity", "delegateGrade", "delegateExperience", "delegateMotivationLetter", "delegateAdditionalInfo",
  ]);
  rows.push({ applicationType: "Delegation", text: delegation.join("\t") });

  for (const type of ["delegate", "chair", "press", "admin"]) {
    const headers: string[] = [];
    const common = ["fullName", "email", "phoneNumber", "nationalId", "birthDate", "gender", "school", "city", "grade"];
    for (const key of common) add(headers, type, key);
    if (type === "delegate") {
      add(headers, type, "englishLevel");
      choices(headers, type);
      add(headers, type, "experience");
      add(headers, type, "motivationLetter");
    } else if (type === "press") {
      add(headers, type, "experience");
      add(headers, type, "motivationLetter");
      add(headers, type, "camera");
    } else if (type === "chair") {
      add(headers, type, "englishLevel");
      choices(headers, type);
      add(headers, type, "experience");
      add(headers, type, "references");
      add(headers, type, "motivationLetter");
      add(headers, type, "chairAnswer1");
      add(headers, type, "chairAnswer3");
      add(headers, type, "chairAnswer2");
    } else {
      add(headers, type, "experience");
      add(headers, type, "motivationLetter");
    }
    add(headers, type, "dietaryPreferences");
    add(headers, type, "additionalInfo");
    addCustom(headers, type, [
      ...common, "englishLevel", "choice", "experience", "references", "motivationLetter", "camera", "chairAnswer1", "chairAnswer2", "chairAnswer3", "dietaryPreferences", "additionalInfo",
    ]);
    rows.push({ applicationType: type[0].toUpperCase() + type.slice(1), text: headers.join("\t") });
  }

  return rows;
}
