import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { getEmailTemplateViews } from "@/lib/applications/templateStore";
import {
  APPLICATION_PAGE_SIZE,
  buildApplicationQueryString,
  parseApplicationFilters,
  parseApplicationPage,
} from "@/lib/applications/filters";
import {
  applicationListSelect,
  buildApplicationOrderBy,
  buildApplicationWhere,
  toApplicationListItem,
} from "@/lib/applications/query";
import type {
  ApplicationCounts,
  ApplicationStatus,
  ApplicationType,
} from "@/lib/applications/types";
import ApplicationsDashboard from "@/components/admin/applications/ApplicationsDashboard";

export const metadata = {
  title: "Applications & Mail Center",
  robots: "noindex",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseApplicationFilters(params);
  const requestedPage = parseApplicationPage(params.page);
  const where = buildApplicationWhere(filters);

  const [rows, total, statusCounts, typeCounts, templates, settings] = await Promise.all([
    prisma.application.findMany({
      where,
      select: applicationListSelect,
      orderBy: buildApplicationOrderBy(),
      skip: (requestedPage - 1) * APPLICATION_PAGE_SIZE,
      take: APPLICATION_PAGE_SIZE,
    }),
    prisma.application.count({ where }),
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.application.groupBy({ by: ["applicationType"], _count: { _all: true } }),
    getEmailTemplateViews(),
    getSiteSettings(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / APPLICATION_PAGE_SIZE));
  if (requestedPage > totalPages && total > 0) {
    redirect(`/admin/applications${buildApplicationQueryString(filters, totalPages)}`);
  }

  const byStatus: Record<ApplicationStatus, number> = {
    pending: 0,
    accepted: 0,
    waitlisted: 0,
    denied: 0,
  };
  for (const row of statusCounts) {
    if (row.status in byStatus) byStatus[row.status as ApplicationStatus] = row._count._all;
  }

  const byType: Record<ApplicationType, number> = {
    delegate: 0,
    chair: 0,
    press: 0,
    admin: 0,
    delegation: 0,
  };
  for (const row of typeCounts) {
    if (row.applicationType in byType) byType[row.applicationType as ApplicationType] = row._count._all;
  }

  const counts: ApplicationCounts = {
    total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    byStatus,
    byType,
  };

  return (
    <ApplicationsDashboard
      key={`${JSON.stringify(filters)}:${requestedPage}`}
      applications={rows.map(toApplicationListItem)}
      filters={filters}
      pagination={{
        page: Math.min(requestedPage, totalPages),
        pageSize: APPLICATION_PAGE_SIZE,
        total,
        totalPages,
      }}
      counts={counts}
      templates={templates}
      conference={{
        brandName: settings.conference.brandName,
        displayName: settings.conference.displayName,
        shortName: settings.conference.shortName,
        dates: settings.conference.dates,
        location: settings.conference.location,
        senderEmail: settings.conference.senderEmail,
        siteUrl: settings.conference.siteUrl,
      }}
      applicationTitles={Object.fromEntries(
        settings.applications.map((application) => [application.id, application.title])
      )}
      exportHref={`/admin/applications/export${buildApplicationQueryString(filters)}`}
    />
  );
}
