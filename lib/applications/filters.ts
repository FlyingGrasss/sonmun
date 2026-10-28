import {
  isApplicationStatus,
  isApplicationType,
  isEmailFilter,
} from "@/lib/applications/validation";
import type { ApplicationFilters } from "@/lib/applications/types";

export const APPLICATION_PAGE_SIZE = 25;

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = {
  type: "all",
  status: "all",
  emailStatus: "all",
  q: "",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseApplicationFilters(
  input: Record<string, string | string[] | undefined>
): ApplicationFilters {
  const type = firstValue(input.type);
  const status = firstValue(input.status);
  const emailStatus = firstValue(input.emailStatus);
  const query = firstValue(input.q) ?? "";

  return {
    type: isApplicationType(type) ? type : "all",
    status: isApplicationStatus(status) ? status : "all",
    emailStatus: isEmailFilter(emailStatus) ? emailStatus : "all",
    q: query.replace(/\s+/g, " ").trim().slice(0, 120),
  };
}

export function parseApplicationPage(value: string | string[] | undefined) {
  const raw = firstValue(value);
  const page = Number(raw);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), 10_000);
}

export function buildApplicationQueryString(filters: ApplicationFilters, page?: number) {
  const params = new URLSearchParams();
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.emailStatus !== "all") params.set("emailStatus", filters.emailStatus);
  if (filters.q) params.set("q", filters.q);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(filters: ApplicationFilters) {
  return (
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.emailStatus !== "all" ||
    filters.q.length > 0
  );
}
