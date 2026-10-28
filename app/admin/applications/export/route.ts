import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { parseApplicationFilters } from "@/lib/applications/filters";
import { buildApplicationOrderBy, buildApplicationWhere } from "@/lib/applications/query";
import { applicationsToCsv } from "@/lib/applications/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const filters = parseApplicationFilters(Object.fromEntries(request.nextUrl.searchParams));
  const where = buildApplicationWhere(filters);
  const total = await prisma.application.count({ where });
  if (total > 5000) {
    return new Response("Too many applications to export. Narrow the filters to 5,000 rows or fewer.", {
      status: 422,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const rows = await prisma.application.findMany({
    where,
    orderBy: buildApplicationOrderBy(),
    take: 5000,
    select: {
      id: true,
      applicationType: true,
      fullName: true,
      email: true,
      phone: true,
      school: true,
      status: true,
      givenCommittee: true,
      allocation: true,
      notes: true,
      appliedAt: true,
      lastEmailSentAt: true,
      lastEmailStatus: true,
      statusEmailSent: true,
      createdAt: true,
    },
  });

  const csv = applicationsToCsv(rows);
  const filename = `sonmun-applications-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
