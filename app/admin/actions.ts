"use server";

import { clearAdminSession, setAdminSession, assertAdminPassword, requireAdmin } from "@/lib/adminAuth";
import { parseDocuments } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
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
  await prisma.committee.delete({ where: { id } });
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
  await prisma.secretariatMember.delete({ where: { id } });
  revalidatePath("/secretariat");
  redirect("/admin");
}
