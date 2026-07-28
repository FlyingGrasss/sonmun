"use server";

import { clearAdminSession, setAdminSession, assertAdminPassword, requireAdmin } from "@/lib/adminAuth";
import { parseDocuments } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { fallbackSettings, type EditableSettings } from "@/lib/siteSettings";
import { questionTextFromEditor } from "@/lib/questionText";
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

  await prisma.committee.update({
    where: { id },
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

  await prisma.secretariatMember.update({
    where: { id },
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

  const settings = JSON.parse(JSON.stringify(fallbackSettings)) as EditableSettings;
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
  conference.siteUrl = stringValue(formData, "siteUrl");
  conference.location.city = stringValue(formData, "locationCity");
  conference.location.country = stringValue(formData, "locationCountry");
  conference.organizer.name = stringValue(formData, "organizerName");

  settings.form.minimumMotivationWords = intValue(formData, "minimumMotivationWords");
  settings.form.minimumDelegates = intValue(formData, "minimumDelegates");
  settings.form.committeePreferenceCount = intValue(formData, "committeePreferenceCount");
  settings.pages.committeesEnabled = checkboxValue(formData, "committeesEnabled");
  settings.pages.secretariatEnabled = checkboxValue(formData, "secretariatEnabled");

  for (const application of settings.applications) {
    application.enabled = checkboxValue(formData, `application_${application.id}_enabled`);
    application.title = stringValue(formData, `application_${application.id}_title`);
    application.formTitle = stringValue(formData, `application_${application.id}_formTitle`);
    application.description = stringValue(formData, `application_${application.id}_description`);
  }

  for (const type of Object.keys(settings.questions)) {
    const questions: Record<string, string> = {};
    const count = intValue(formData, `question_${type}_count`);
    for (let index = 0; index < count; index += 1) {
      const key = stringValue(formData, `question_${type}_${index}_key`).replace(/[^a-zA-Z0-9_]/g, "");
      const text = questionTextFromEditor(stringValue(formData, `question_${type}_${index}_text`));
      if (key && text) questions[key] = text;
    }
    settings.questions[type] = questions;
  }

  settings.letters.titlePrefix = stringValue(formData, "lettersTitlePrefix");
  settings.letters.titleHighlight = stringValue(formData, "lettersTitleHighlight");
  settings.letters.opening = stringValue(formData, "lettersOpening");
  settings.letters.paragraphs = stringValue(formData, "lettersParagraphs")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  await prisma.conferenceSettings.upsert({
    where: { id: 1 },
    create: { id: 1, data: settings },
    update: { data: settings },
  });

  revalidatePath("/", "layout");
  revalidatePath("/letters");
  revalidatePath("/apply");
  revalidatePath("/sitemap.xml");
  revalidatePath("/committees");
  revalidatePath("/secretariat");
  for (const application of settings.applications) {
    revalidatePath(`/apply/${application.id}`);
  }

  redirect("/admin");
}
