import conferenceConfig from "@/config/conference.json";
import { normalizeQuestionGroups } from "@/lib/questions";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? conferenceConfig.conference.siteUrl;

export const CONFERENCE = {
  ...conferenceConfig.conference,
  siteUrl,
} as const;

export const THEME = conferenceConfig.theme;
export const ASSETS = conferenceConfig.assets;
export const APPLICATIONS = conferenceConfig.applications;
export const FORM = conferenceConfig.form;
export const COPY = conferenceConfig.copy;
const CONFIG_QUESTIONS = normalizeQuestionGroups(conferenceConfig.form.questions, conferenceConfig.form);

export function getApplicationQuestions(type: string) {
  return CONFIG_QUESTIONS[type] ?? CONFIG_QUESTIONS.delegate;
}

export function formatConferenceText(
  value: string,
  replacements: Record<string, string | number>
) {
  return Object.entries(replacements).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value
  );
}

export function formatFormText(value: string, extra: Record<string, string | number> = {}) {
  return formatConferenceText(value, {
    minimumMotivationWords: FORM.minimumMotivationWords,
    minimumDelegates: FORM.minimumDelegates,
    committeePreferenceCount: FORM.committeePreferenceCount,
    ...extra,
  });
}
