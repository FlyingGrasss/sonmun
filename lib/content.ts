import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getPublishedCommittees = cache(async () => {
  return prisma.committee.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
});

export const getPublishedCommittee = cache(async (slug: string) => {
  return prisma.committee.findFirst({
    where: { slug, isPublished: true },
  });
});

export const getPublishedSecretariat = cache(async () => {
  return prisma.secretariatMember.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
});

export const getPublishedSecretariatMember = cache(async (slug: string) => {
  return prisma.secretariatMember.findFirst({
    where: { slug, isPublished: true },
  });
});
