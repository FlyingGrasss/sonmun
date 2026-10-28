"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode,
  Mail,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import {
  bulkUpdateStatusAction,
  getApplicationDetailAction,
  getUnsentTargetsAction,
  updateApplicationAction,
} from "@/app/admin/applications/actions";
import { buildApplicationQueryString, hasActiveFilters } from "@/lib/applications/filters";
import { formatDateTime } from "@/lib/applications/format";
import {
  APPLICATION_STATUSES,
  type ApplicationCounts,
  type ApplicationDetail,
  type ApplicationFilters,
  type ApplicationListItem,
  type ApplicationStatus,
  type ApplicationType,
  type EmailTemplateView,
  type UnsentTarget,
} from "@/lib/applications/types";
import type { EmailConference } from "@/lib/applications/emailTemplates";
import ApplicationDetailDialog from "./ApplicationDetailDialog";
import BulkEmailDialog from "./BulkEmailDialog";
import ConfirmDialog from "./ConfirmDialog";
import EmailTemplatesDialog from "./EmailTemplatesDialog";
import SyncDialog from "./SyncDialog";
import { STATUS_CONFIG } from "./StatusBadge";

type Props = {
  applications: ApplicationListItem[];
  filters: ApplicationFilters;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  counts: ApplicationCounts;
  templates: EmailTemplateView[];
  conference: EmailConference;
  applicationTitles: Record<string, string>;
  exportHref: string;
};

type BulkState = {
  open: boolean;
  targets: UnsentTarget[];
  mode: "unsent" | "selected";
  total?: number;
};

function toTarget(application: ApplicationListItem): UnsentTarget {
  return {
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    status: application.status,
  };
}

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((value) => values.add(value));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((value) => values.add(value));
  const sorted = [...values].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(value);
  });
  return result;
}

export default function ApplicationsDashboard({
  applications,
  filters,
  pagination,
  counts,
  templates,
  conference,
  applicationTitles,
  exportHref,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticApplications, applyOptimistic] = useOptimistic(
    applications,
    (
      state: ApplicationListItem[],
      update: { id: string; status: ApplicationStatus; statusEmailSent: boolean }
    ) =>
      state.map((application) =>
        application.id === update.id
          ? { ...application, status: update.status, statusEmailSent: update.statusEmailSent }
          : application
      )
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ApplicationDetail | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkState, setBulkState] = useState<BulkState>({
    open: false,
    targets: [],
    mode: "unsent",
  });
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [bulkStatusBusy, setBulkStatusBusy] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const detailRequestRef = useRef(0);

  const allOnPageSelected =
    optimisticApplications.length > 0 &&
    optimisticApplications.every((application) => selectedIds.has(application.id));
  const someOnPageSelected = optimisticApplications.some((application) => selectedIds.has(application.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
    }
  }, [allOnPageSelected, someOnPageSelected]);

  const selectedApplications = optimisticApplications.filter((application) => selectedIds.has(application.id));
  const selectedCount = selectedApplications.length;

  const filterKey = JSON.stringify(filters);

  const hrefFor = (overrides: Partial<ApplicationFilters>, page?: number) => {
    const next = { ...filters, ...overrides };
    return `/admin/applications${buildApplicationQueryString(next, page)}`;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      allOnPageSelected ? new Set() : new Set(optimisticApplications.map((application) => application.id))
    );
  };

  const openDetail = async (id: string) => {
    if (detailLoadingId) return;
    const request = ++detailRequestRef.current;
    setDetailLoadingId(id);
    try {
      const data = await getApplicationDetailAction(id);
      if (request !== detailRequestRef.current) return;
      if (!data) {
        toast.error("This application could not be found.");
        return;
      }
      setDetailData(data);
      setDetailId(data.id);
      setDetailVersion((version) => version + 1);
    } catch {
      if (request === detailRequestRef.current) {
        toast.error("The application could not be loaded.");
      }
    } finally {
      if (request === detailRequestRef.current) setDetailLoadingId(null);
    }
  };

  const refreshDetail = async () => {
    if (!detailId) return;
    const request = ++detailRequestRef.current;
    try {
      const data = await getApplicationDetailAction(detailId);
      if (request !== detailRequestRef.current) return;
      if (data) setDetailData(data);
    } catch {
      if (request === detailRequestRef.current) {
        toast.error("The application details could not be refreshed.");
      }
    }
    router.refresh();
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setDetailId(null);
    setDetailData(null);
  };

  const handleInlineStatusChange = (application: ApplicationListItem, nextStatus: ApplicationStatus) => {
    if (application.status === nextStatus) return;
    setUpdatingIds((current) => new Set(current).add(application.id));

    startTransition(async () => {
      applyOptimistic({ id: application.id, status: nextStatus, statusEmailSent: false });
      try {
        const response = await updateApplicationAction(application.id, { status: nextStatus });
        if (!response.ok) {
          toast.error(response.error);
          return;
        }
        toast.success(`${application.fullName} set to ${STATUS_CONFIG[nextStatus].label}.`);
        router.refresh();
      } catch {
        toast.error("The status could not be updated.");
      } finally {
        setUpdatingIds((current) => {
          const next = new Set(current);
          next.delete(application.id);
          return next;
        });
      }
    });
  };

  const handleBulkStatus = async () => {
    if (!pendingStatus) return;
    setBulkStatusBusy(true);
    try {
      const response = await bulkUpdateStatusAction(
        selectedApplications.map((application) => application.id),
        pendingStatus
      );
      if (!response.ok) {
        setPendingStatus(null);
        toast.error(response.error);
        return;
      }
      const unchanged = response.requested - response.updated;
      toast.success(
        `${response.updated} application${response.updated === 1 ? "" : "s"} updated${
          unchanged > 0 ? `; ${unchanged} already had that status` : ""
        }.`
      );
      setSelectedIds(new Set());
      setPendingStatus(null);
      router.refresh();
    } catch {
      setPendingStatus(null);
      toast.error("The bulk status update failed.");
    } finally {
      setBulkStatusBusy(false);
    }
  };

  const openBulkForSelected = () => {
    const targets = selectedApplications.map(toTarget);
    if (targets.length === 0) {
      toast.error("Select at least one application.");
      return;
    }
    if (targets.every((target) => target.status === "pending")) {
      toast.error("Set a final status before sending status emails.");
      return;
    }
    setBulkState({ open: true, targets, mode: "selected" });
  };

  const openBulkForUnsent = async () => {
    setBulkLoading(true);
    try {
      const response = await getUnsentTargetsAction(filters);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      if (response.targets.length === 0) {
        toast.success("No pending status emails match these filters.");
        return;
      }
      setBulkState({
        open: true,
        targets: response.targets,
        mode: "unsent",
        total: response.total,
      });
    } catch {
      toast.error("The unsent email list could not be loaded.");
    } finally {
      setBulkLoading(false);
    }
  };

  const totalLabel =
    pagination.total === 0
      ? "0 applications"
      : `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(
          pagination.page * pagination.pageSize,
          pagination.total
        )} of ${pagination.total}`;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#171310",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {conference.shortName}
              </p>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Applications &amp; Mail Center</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Review applications, assign committees, and send status emails from one place. Existing
                submissions can be imported from Google Sheets at any time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <form action={logoutAction}>
                <button className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                  Logout
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSyncOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-accent)]"
            >
              <RefreshCw className="h-4 w-4" />
              Sync sheets
            </button>
            <button
              type="button"
              onClick={() => setTemplatesOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-accent)]"
            >
              <FileCode className="h-4 w-4" />
              Email templates
            </button>
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-accent)]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <button
              type="button"
              onClick={openBulkForUnsent}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {bulkLoading ? "Loading..." : "Send unsent emails"}
            </button>
          </div>
        </header>

        <section aria-label="Application statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { key: "all" as const, label: "Total", value: counts.total, className: "text-white" },
            { key: "pending" as const, label: "Pending", value: counts.byStatus.pending, className: "text-amber-200" },
            { key: "accepted" as const, label: "Accepted", value: counts.byStatus.accepted, className: "text-emerald-200" },
            { key: "waitlisted" as const, label: "Waitlisted", value: counts.byStatus.waitlisted, className: "text-sky-200" },
            { key: "denied" as const, label: "Denied", value: counts.byStatus.denied, className: "text-rose-200" },
          ].map((item) => {
            const active = item.key === "all" ? filters.status === "all" : filters.status === item.key;
            return (
              <Link
                key={item.key}
                href={hrefFor({ status: item.key })}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl border p-4 transition ${
                  active
                    ? "border-[var(--color-accent)]/60 bg-white/10"
                    : "border-white/10 bg-black/20 hover:border-white/25"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{item.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${item.className}`}>{item.value}</p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
          <form
            key={filterKey}
            method="get"
            action="/admin/applications"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_170px_190px_auto]"
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
              Search
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Name, email, school, committee..."
                  className="w-full rounded-lg border border-white/15 bg-black/25 py-2 pl-9 pr-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-white/30 focus:border-[var(--color-accent)]"
                />
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
              Type
              <select
                name="type"
                defaultValue={filters.type}
                className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[var(--color-accent)]"
              >
                <option value="all">All types</option>
                {Object.entries(applicationTitles).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} ({counts.byType[value as ApplicationType] ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
              Status
              <select
                name="status"
                defaultValue={filters.status}
                className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[var(--color-accent)]"
              >
                <option value="all">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
              Email
              <select
                name="emailStatus"
                defaultValue={filters.emailStatus}
                className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[var(--color-accent)]"
              >
                <option value="all">All email states</option>
                <option value="not_sent">Not sent</option>
                <option value="sent">Sent</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white"
              >
                Apply
              </button>
              {hasActiveFilters(filters) && (
                <Link
                  href="/admin/applications"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </section>

        {selectedCount > 0 && (
          <section
            aria-label="Bulk actions"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3"
          >
            <span className="text-sm font-semibold text-white">
              {selectedCount} selected
            </span>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <span className="sr-only">Set status for selected applications</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  setPendingStatus(event.target.value as ApplicationStatus);
                  event.target.value = "";
                }}
                className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
              >
                <option value="" disabled>
                  Set status...
                </option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={openBulkForSelected}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white"
            >
              <Mail className="h-4 w-4" />
              Send emails to selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              Clear selection
            </button>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <p className="text-sm text-white/55">{totalLabel}</p>
            <p className="text-xs text-white/35">Page {pagination.page} of {pagination.totalPages}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/45">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all applications on this page"
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3">Applicant</th>
                  <th scope="col" className="px-4 py-3">Contact</th>
                  <th scope="col" className="px-4 py-3">School</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Committee</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {optimisticApplications.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center">
                      {counts.total === 0 ? (
                        <div className="mx-auto max-w-md space-y-3">
                          <Users className="mx-auto h-8 w-8 text-white/30" />
                          <p className="text-base font-semibold text-white">No applications yet</p>
                          <p className="text-sm text-white/50">
                            Import existing submissions from the five Google Sheets to start reviewing
                            applications and sending emails.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSyncOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Sync from Google Sheets
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-white">No matching applications</p>
                          <p className="text-sm text-white/50">Try a different search or clear the filters.</p>
                          <Link
                            href="/admin/applications"
                            className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
                          >
                            Clear filters
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  optimisticApplications.map((application) => {
                    const statusConfig = STATUS_CONFIG[application.status];
                    const selected = selectedIds.has(application.id);
                    const updating = updatingIds.has(application.id);
                    return (
                      <tr key={application.id} className={selected ? "bg-[var(--color-accent)]/5" : undefined}>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(application.id)}
                            aria-label={`Select ${application.fullName}`}
                            className="h-4 w-4 accent-[var(--color-accent)]"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => void openDetail(application.id)}
                            disabled={detailLoadingId === application.id}
                            className="text-left font-semibold text-white hover:underline disabled:opacity-50"
                          >
                            {application.fullName}
                          </button>
                          <p className="mt-0.5 text-xs text-white/40">
                            {application.appliedAt ? `Applied ${formatDateTime(application.appliedAt)}` : "Imported from sheet"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="break-all text-xs text-white/75">{application.email}</p>
                          {application.phone && <p className="mt-0.5 text-xs text-white/40">{application.phone}</p>}
                        </td>
                        <td className="max-w-[180px] px-4 py-3 align-top">
                          <p className="truncate text-xs text-white/65" title={application.school ?? undefined}>
                            {application.school ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/65">
                            {applicationTitles[application.applicationType] ?? application.applicationType}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <label className="sr-only" htmlFor={`status-${application.id}`}>
                            Status for {application.fullName}
                          </label>
                          <select
                            id={`status-${application.id}`}
                            value={application.status}
                            disabled={updating}
                            onChange={(event) =>
                              void handleInlineStatusChange(application, event.target.value as ApplicationStatus)
                            }
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${statusConfig.className}`}
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_CONFIG[status].label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="text-xs text-white/70">{application.givenCommittee ?? "—"}</p>
                          {application.allocation && (
                            <p className="mt-0.5 text-xs text-white/40">{application.allocation}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {application.status === "pending" ? (
                            <span className="text-xs text-white/35">Status pending</span>
                          ) : application.statusEmailSent ? (
                            <span className="text-xs text-emerald-200">
                              Sent {formatDateTime(application.lastEmailSentAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-200">Not sent</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <button
                            type="button"
                            onClick={() => void openDetail(application.id)}
                            disabled={detailLoadingId === application.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:border-[var(--color-accent)] hover:text-white disabled:opacity-50"
                          >
                            {detailLoadingId === application.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                            ) : (
                              <Settings2 className="h-3.5 w-3.5" />
                            )}
                            {detailLoadingId === application.id ? "Loading..." : "Manage"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <nav aria-label="Application pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
              <p className="text-xs text-white/40">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-1">
                {pagination.page > 1 ? (
                  <Link
                    href={hrefFor({}, pagination.page - 1)}
                    aria-label="Previous page"
                    className="rounded-lg border border-white/15 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span aria-hidden="true" className="rounded-lg border border-white/5 p-2 text-white/20">
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}
                {pageNumbers(pagination.page, pagination.totalPages).map((value, index) =>
                  value === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-white/35">
                      …
                    </span>
                  ) : (
                    <Link
                      key={value}
                      href={hrefFor({}, value)}
                      aria-current={value === pagination.page ? "page" : undefined}
                      className={`min-w-8 rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold transition ${
                        value === pagination.page
                          ? "bg-[var(--color-accent)] text-[var(--background)]"
                          : "border border-white/10 text-white/65 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {value}
                    </Link>
                  )
                )}
                {pagination.page < pagination.totalPages ? (
                  <Link
                    href={hrefFor({}, pagination.page + 1)}
                    aria-label="Next page"
                    className="rounded-lg border border-white/15 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span aria-hidden="true" className="rounded-lg border border-white/5 p-2 text-white/20">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>

      <ApplicationDetailDialog
        detail={detailId ? detailData : null}
        version={detailVersion}
        onClose={closeDetail}
        onSaved={() => {
          void refreshDetail();
        }}
        onEmailSent={() => {
          void refreshDetail();
        }}
        conference={conference}
      />

      {templatesOpen && (
        <EmailTemplatesDialog
          open
          onClose={() => setTemplatesOpen(false)}
          templates={templates}
          conference={conference}
          onSaved={() => router.refresh()}
        />
      )}

      {syncOpen && (
        <SyncDialog
          open
          onClose={() => setSyncOpen(false)}
          onComplete={() => router.refresh()}
        />
      )}

      {bulkState.open && (
        <BulkEmailDialog
          open
          onClose={() => setBulkState((current) => ({ ...current, open: false }))}
          targets={bulkState.targets}
          mode={bulkState.mode}
          totalAvailable={bulkState.total}
          onComplete={() => router.refresh()}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Update application status"
        description={
          pendingStatus
            ? `Set ${selectedCount} selected application${selectedCount === 1 ? "" : "s"} to ${STATUS_CONFIG[pendingStatus].label}? Only applications whose status changes will have their status email marked as not sent.`
            : ""
        }
        confirmLabel={pendingStatus ? `Set ${STATUS_CONFIG[pendingStatus].label}` : "Update"}
        pending={bulkStatusBusy}
        onConfirm={handleBulkStatus}
        onClose={() => setPendingStatus(null)}
      />
    </main>
  );
}
