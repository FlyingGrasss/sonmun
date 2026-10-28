import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApplicationFilters, ApplicationListItem, ApplicationStatus, ApplicationType } from "@/lib/applications/types";

export const applicationListSelect = {
  id: true,
  applicationType: true,
  fullName: true,
  email: true,
  phone: true,
  school: true,
  status: true,
  givenCommittee: true,
  allocation: true,
  appliedAt: true,
  lastEmailSentAt: true,
  lastEmailStatus: true,
  statusEmailSent: true,
  createdAt: true,
} satisfies Prisma.ApplicationSelect;

export type ApplicationListRow = Prisma.ApplicationGetPayload<{ select: typeof applicationListSelect }>;

export function buildApplicationWhere(filters: ApplicationFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  if (filters.type !== "all") where.applicationType = filters.type;
  if (filters.status !== "all") where.status = filters.status;
  if (filters.emailStatus === "sent") where.statusEmailSent = true;
  if (filters.emailStatus === "not_sent") where.statusEmailSent = false;

  if (filters.q) {
    where.OR = [
      { fullName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { school: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { givenCommittee: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildApplicationOrderBy(): Prisma.ApplicationOrderByWithRelationInput[] {
  return [{ appliedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
}

export function toApplicationListItem(row: ApplicationListRow): ApplicationListItem {
  return {
    id: row.id,
    applicationType: row.applicationType as ApplicationType,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    school: row.school,
    status: row.status as ApplicationStatus,
    givenCommittee: row.givenCommittee,
    allocation: row.allocation,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    lastEmailSentAt: row.lastEmailSentAt?.toISOString() ?? null,
    lastEmailStatus: row.lastEmailStatus,
    statusEmailSent: row.statusEmailSent,
    createdAt: row.createdAt.toISOString(),
  };
}
