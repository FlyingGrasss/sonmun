import conferenceConfig from "@/config/conference.json";
import { prisma } from "@/lib/prisma";
import { normalizeQuestionGroups, type QuestionGroups } from "@/lib/questions";

export type EditableApplication = {
  id: string;
  enabled: boolean;
  title: string;
  formTitle: string;
  description: string;
  image?: string;
};

export type EditableSettings = {
  conference: {
    id: string;
    brandName: string;
    shortName: string;
    displayName: string;
    fullName: string;
    sessionName: string;
    dates: string;
    startDateIso: string;
    year: number;
    hashtag: string;
    siteUrl: string;
    keywords: string[];
    locale: string;
    location: {
      city: string;
      country: string;
    };
    organizer: {
      name: string;
      creditName: string;
      creditUrl: string;
    };
  };
  applications: EditableApplication[];
  form: {
    minimumDelegates: number;
    committeePreferenceCount: number;
  };
  pages: {
    committeesEnabled: boolean;
    secretariatEnabled: boolean;
  };
  questions: QuestionGroups;
  letters: {
    titlePrefix: string;
    titleHighlight: string;
    opening: string;
    paragraphs: string[];
  };
};

const config = conferenceConfig as typeof conferenceConfig;

export function normalizeSiteUrl(value: string, fallback = config.conference.siteUrl) {
  const candidate = value.trim();
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const fallbackSettings: EditableSettings = {
  conference: {
    id: config.conference.id,
    brandName: config.conference.brandName,
    shortName: config.conference.shortName,
    displayName: config.conference.displayName,
    fullName: config.conference.fullName,
    sessionName: config.conference.sessionName,
    dates: config.conference.dates,
    startDateIso: config.conference.startDateIso,
    year: config.conference.year,
    hashtag: config.conference.hashtag,
    siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? config.conference.siteUrl),
    keywords: [...config.conference.keywords],
    locale: config.conference.locale,
    location: { ...config.conference.location },
    organizer: { ...config.conference.organizer },
  },
  applications: config.applications.map((application) => ({ ...application })),
  form: {
    minimumDelegates: config.form.minimumDelegates,
    committeePreferenceCount: config.form.committeePreferenceCount,
  },
  pages: {
    committeesEnabled: true,
    secretariatEnabled: true,
  },
  questions: normalizeQuestionGroups(config.form.questions, config.form),
  letters: {
    titlePrefix: config.copy.letters.titlePrefix,
    titleHighlight: config.copy.letters.titleHighlight,
    opening: config.copy.letters.opening,
    paragraphs: [...config.copy.letters.paragraphs],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeSettings(value: unknown): EditableSettings {
  if (!isRecord(value)) {
    return fallbackSettings;
  }

  const conference = isRecord(value.conference) ? value.conference : {};
  const location = isRecord(conference.location) ? conference.location : {};
  const organizer = isRecord(conference.organizer) ? conference.organizer : {};
  const applications = Array.isArray(value.applications)
    ? value.applications
        .filter(isRecord)
        .map((application) => ({
          ...application,
        }))
    : fallbackSettings.applications;
  const savedQuestions = isRecord(value.questions) ? value.questions : null;
  const letters = isRecord(value.letters) ? value.letters : {};
  const form = isRecord(value.form) ? value.form : {};
  const pages = isRecord(value.pages) ? value.pages : {};

  return {
    conference: {
      ...fallbackSettings.conference,
      ...conference,
      siteUrl: normalizeSiteUrl(String(conference.siteUrl ?? fallbackSettings.conference.siteUrl), fallbackSettings.conference.siteUrl),
      location: { ...fallbackSettings.conference.location, ...location },
      organizer: { ...fallbackSettings.conference.organizer, ...organizer },
    } as EditableSettings["conference"],
    applications: applications.map((application) => ({
      ...fallbackSettings.applications.find((item) => item.id === application.id),
      ...application,
    })) as EditableApplication[],
    form: {
      ...fallbackSettings.form,
      ...form,
    } as EditableSettings["form"],
    pages: {
      ...fallbackSettings.pages,
      ...pages,
    } as EditableSettings["pages"],
    questions: normalizeQuestionGroups(
      savedQuestions ?? config.form.questions,
      {
        minimumDelegates: Number(form.minimumDelegates ?? fallbackSettings.form.minimumDelegates),
        committeePreferenceCount: Number(form.committeePreferenceCount ?? fallbackSettings.form.committeePreferenceCount),
      },
      config.form.questions
    ),
    letters: {
      ...fallbackSettings.letters,
      ...letters,
      paragraphs: Array.isArray(letters.paragraphs)
        ? letters.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string")
        : fallbackSettings.letters.paragraphs,
    },
  };
}

export async function getSiteSettings(): Promise<EditableSettings> {
  try {
    const saved = await prisma.conferenceSettings.findUnique({ where: { id: 1 } });
    return saved ? mergeSettings(saved.data) : fallbackSettings;
  } catch (error) {
    console.error("[settings] Falling back to conference.json:", error);
    return fallbackSettings;
  }
}
