import { prisma } from "@/lib/prisma";

export async function getPublishedCommittees() {
  return prisma.committee.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function getPublishedCommittee(slug: string) {
  return prisma.committee.findFirst({
    where: { slug, isPublished: true },
  });
}

export async function getPublishedSecretariat() {
  return prisma.secretariatMember.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function getPublishedSecretariatMember(slug: string) {
  return prisma.secretariatMember.findFirst({
    where: { slug, isPublished: true },
  });
}
