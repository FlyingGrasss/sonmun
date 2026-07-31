"use server";

import { clearAdminSession, setAdminSession, assertAdminPassword, requireAdmin } from "@/lib/adminAuth";
import { parseDocuments } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { getSiteSettings, normalizeSiteUrl, type EditableSettings } from "@/lib/siteSettings";
import { normalizeQuestionDefinition, type QuestionDefinition, type QuestionType } from "@/lib/questions";
import { deleteAdminImage } from "@/lib/adminUpload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function intValue(formData: FormData, key: string) {
  const parsed = Number(stringValue(formData, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function loginAction(formData: FormData) {
  const password = stringValue(formData, "password");

  if (!assertAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createCommitteeAction(formData: FormData) {
  await requireAdmin();
  const name = stringValue(formData, "name");
  const slug = stringValue(formData, "slug") || slugify(name);

  await prisma.committee.create({
    data: {
      name,
      slug,
      sortOrder: intValue(formData, "sortOrder"),
      imageUrl: stringValue(formData, "imageUrl"),
      description: stringValue(formData, "description"),
      documents: parseDocuments(formData.get("documents")),
      isPublished: checkboxValue(formData, "isPublished"),
    },
  });

  revalidatePath("/committees");
  redirect("/admin");
}

export async function updateCommitteeAction(id: number, formData: FormData) {
  await requireAdmin();
  const name = stringValue(formData, "name");
  const slug = stringValue(formData, "slug") || slugify(name);
  const imageUrl = stringValue(formData, "imageUrl");
  const previous = await prisma.committee.findUnique({ where: { id }, select: { imageUrl: true } });

  await prisma.committee.update({
    where: { id },
    data: {
      name,
      slug,
      sortOrder: intValue(formData, "sortOrder"),
      imageUrl,
      description: stringValue(formData, "description"),
      documents: parseDocuments(formData.get("documents")),
      isPublished: checkboxValue(formData, "isPublished"),
    },
  });
  if (previous?.imageUrl !== imageUrl) await deleteAdminImage(previous?.imageUrl);

  revalidatePath("/committees");
  redirect("/admin");
}

export async function deleteCommitteeAction(id: number) {
  await requireAdmin();
  const committee = await prisma.committee.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.committee.delete({ where: { id } });
  await deleteAdminImage(committee?.imageUrl);
  revalidatePath("/committees");
  redirect("/admin");
}

export async function createSecretariatAction(formData: FormData) {
  await requireAdmin();
  const name = stringValue(formData, "name");
  const slug = stringValue(formData, "slug") || slugify(name);

  await prisma.secretariatMember.create({
    data: {
      name,
      slug,
      role: stringValue(formData, "role"),
      sortOrder: intValue(formData, "sortOrder"),
      imageUrl: stringValue(formData, "imageUrl"),
      bio: stringValue(formData, "bio"),
      instagram: stringValue(formData, "instagram") || null,
      isPublished: checkboxValue(formData, "isPublished"),
    },
  });

  revalidatePath("/secretariat");
  redirect("/admin");
}

export async function updateSecretariatAction(id: number, formData: FormData) {
  await requireAdmin();
  const name = stringValue(formData, "name");
  const slug = stringValue(formData, "slug") || slugify(name);
  const imageUrl = stringValue(formData, "imageUrl");
  const previous = await prisma.secretariatMember.findUnique({ where: { id }, select: { imageUrl: true } });

  await prisma.secretariatMember.update({
    where: { id },
    data: {
      name,
      slug,
      role: stringValue(formData, "role"),
      sortOrder: intValue(formData, "sortOrder"),
      imageUrl,
      bio: stringValue(formData, "bio"),
      instagram: stringValue(formData, "instagram") || null,
      isPublished: checkboxValue(formData, "isPublished"),
    },
  });
  if (previous?.imageUrl !== imageUrl) await deleteAdminImage(previous?.imageUrl);

  revalidatePath("/secretariat");
  redirect("/admin");
}

export async function deleteSecretariatAction(id: number) {
  await requireAdmin();
  const member = await prisma.secretariatMember.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.secretariatMember.delete({ where: { id } });
  await deleteAdminImage(member?.imageUrl);
  revalidatePath("/secretariat");
  redirect("/admin");
}

export async function saveConferenceSettingsAction(formData: FormData) {
  await requireAdmin();

  const settings = JSON.parse(JSON.stringify(await getSiteSettings())) as EditableSettings;
  const conference = settings.conference;

  conference.brandName = stringValue(formData, "brandName");
  conference.shortName = stringValue(formData, "shortName");
  conference.displayName = stringValue(formData, "displayName");
  conference.fullName = stringValue(formData, "fullName");
  conference.sessionName = stringValue(formData, "sessionName");
  conference.dates = stringValue(formData, "dates");
  conference.startDateIso = stringValue(formData, "startDateIso");
  conference.year = intValue(formData, "year");
  conference.hashtag = stringValue(formData, "hashtag");
  conference.siteUrl = normalizeSiteUrl(stringValue(formData, "siteUrl"), conference.siteUrl);
  conference.senderEmail = stringValue(formData, "senderEmail").trim() || "onboarding@resend.dev";
  conference.location.city = stringValue(formData, "locationCity");
  conference.location.country = stringValue(formData, "locationCountry");
  conference.organizer.name = stringValue(formData, "organizerName");
  settings.form.minimumDelegates = Math.max(1, intValue(formData, "minimumDelegates"));

  settings.pages.committeesEnabled = checkboxValue(formData, "committeesEnabled");
  settings.pages.secretariatEnabled = checkboxValue(formData, "secretariatEnabled");

  for (const application of settings.applications) {
    application.enabled = checkboxValue(formData, `application_${application.id}_enabled`);
    application.title = stringValue(formData, `application_${application.id}_title`);
    application.formTitle = stringValue(formData, `application_${application.id}_formTitle`);
    application.description = stringValue(formData, `application_${application.id}_description`);
  }

  for (const type of Object.keys(settings.questions)) {
    const questions: QuestionDefinition[] = [];
    const count = intValue(formData, `question_${type}_count`);
    for (let index = 0; index < count; index += 1) {
      const id = stringValue(formData, `question_${type}_${index}_id`).replace(/[^a-zA-Z0-9_]/g, "");
      const label = stringValue(formData, `question_${type}_${index}_label`);
      if (!id || !label) continue;
      questions.push(normalizeQuestionDefinition({
        id,
        label,
        type: stringValue(formData, `question_${type}_${index}_type`) as QuestionType,
        required: checkboxValue(formData, `question_${type}_${index}_required`),
        placeholder: stringValue(formData, `question_${type}_${index}_placeholder`),
        options: stringValue(formData, `question_${type}_${index}_options`).split(/\r?\n/).map((option) => option.trim()).filter(Boolean),
        minWords: Math.max(0, intValue(formData, `question_${type}_${index}_minWords`)),
        minCharacters: Math.max(0, intValue(formData, `question_${type}_${index}_minCharacters`)),
      }, id, settings.form));
    }
    settings.questions[type] = questions;
  }

  const letterCount = Math.max(0, intValue(formData, "lettersCount"));
  settings.letters.entries = Array.from({ length: letterCount }, (_, index) => {
    const prefix = `letter_${index}`;
    const paragraphs = stringValue(formData, `${prefix}_paragraphs`)
      .split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    return {
      id: stringValue(formData, `${prefix}_id`).replace(/[^a-zA-Z0-9_-]/g, "") || `letter-${index + 1}`,
      titlePrefix: stringValue(formData, `${prefix}_titlePrefix`),
      titleHighlight: stringValue(formData, `${prefix}_titleHighlight`),
      opening: stringValue(formData, `${prefix}_opening`),
      paragraphs,
      author: stringValue(formData, `${prefix}_author`),
    };
  });

  await prisma.conferenceSettings.upsert({
    where: { id: 1 },
    create: { id: 1, data: settings },
    update: { data: settings },
  });

  revalidatePath("/", "layout");
  revalidatePath("/letters");
  revalidatePath("/apply");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  revalidatePath("/committees");
  revalidatePath("/secretariat");
  for (const application of settings.applications) {
    revalidatePath(`/apply/${application.id}`);
  }

  return { ok: true };
}
