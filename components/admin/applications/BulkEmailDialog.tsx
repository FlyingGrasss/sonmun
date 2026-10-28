"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Mail, Send } from "lucide-react";
import { sendBulkStatusEmailsAction } from "@/app/admin/applications/actions";
import { createRequestId } from "@/lib/applications/requestId";
import type { SendOneResult, UnsentTarget } from "@/lib/applications/types";
import Modal from "./Modal";

type Progress = {
  current: number;
  total: number;
  sent: number;
  failed: number;
  simulated: number;
  skipped: number;
};

const STATUS_LABELS: Record<string, string> = {
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  denied: "Denied",
  pending: "Pending",
};

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export default function BulkEmailDialog({
  open,
  onClose,
  targets,
  mode,
  totalAvailable,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  targets: UnsentTarget[];
  mode: "unsent" | "selected";
  totalAvailable?: number;
  onComplete: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    total: 0,
    sent: 0,
    failed: 0,
    simulated: 0,
    skipped: 0,
  });
  const [results, setResults] = useState<SendOneResult[]>([]);
  const [finished, setFinished] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const abortedRef = useRef(false);

  useEffect(() => {
    return () => {
      abortedRef.current = true;
    };
  }, []);

  const eligible = useMemo(() => targets.filter((target) => target.status !== "pending"), [targets]);
  const counts = useMemo(() => {
    const value: Record<string, number> = { accepted: 0, waitlisted: 0, denied: 0 };
    for (const target of eligible) value[target.status] = (value[target.status] ?? 0) + 1;
    return value;
  }, [eligible]);

  const sendTargets = async (list: UnsentTarget[]) => {
    if (list.length === 0) return;
    setSending(true);
    setFinished(false);
    setResults([]);
    const requestId = requestIdRef.current ?? createRequestId();
    requestIdRef.current = requestId;
    const collected: SendOneResult[] = [];
    let sent = 0;
    let failed = 0;
    let simulated = 0;
    let skipped = 0;
    const batches = chunk(list, 20);

    for (const [index, batch] of batches.entries()) {
      if (abortedRef.current) return;
      setProgress({
        current: Math.min((index + 1) * 20, list.length),
        total: list.length,
        sent,
        failed,
        simulated,
        skipped,
      });
      try {
        const response = await sendBulkStatusEmailsAction({
          applicationIds: batch.map((target) => target.id),
          requestId,
          mode,
        });
        if (!response.ok) {
          failed += batch.length;
          collected.push(
            ...batch.map((target) => ({
              applicationId: target.id,
              fullName: target.fullName,
              email: target.email,
              ok: false,
              error: response.error,
            }))
          );
        } else {
          sent += response.result.sent;
          failed += response.result.failed;
          simulated += response.result.simulated;
          skipped += response.result.skipped;
          collected.push(...response.result.results);
        }
      } catch {
        failed += batch.length;
        collected.push(
          ...batch.map((target) => ({
            applicationId: target.id,
            fullName: target.fullName,
            email: target.email,
            ok: false,
            error: "The send request failed.",
          }))
        );
      }
      setResults([...collected]);
      setProgress({
        current: Math.min((index + 1) * 20, list.length),
        total: list.length,
        sent,
        failed,
        simulated,
        skipped,
      });
    }

    if (abortedRef.current) return;
    setSending(false);
    setFinished(true);
    onComplete();
  };

  const failedResults = results.filter((result) => !result.ok);
  const warningResults = results.filter((result) => result.ok && result.warning && !result.simulated);
  const failedTargets = eligible.filter((target) =>
    failedResults.some((result) => result.applicationId === target.id)
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "unsent" ? "Send pending status emails" : "Send status emails to selected"}
      description="Each recipient receives the template for their current application status."
      size="lg"
      pending={sending}
      dismissible={!sending}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/45">
            {sending ? "Sending is in progress. Keep this dialog open." : "Emails are sent immediately."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
            >
              Close
            </button>
            {finished && failedTargets.length > 0 ? (
              <button
                type="button"
                onClick={() => sendTargets(failedTargets)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300"
              >
                <Send className="h-4 w-4" />
                Retry {failedTargets.length} failed
              </button>
            ) : (
              <button
                type="button"
                onClick={() => sendTargets(eligible)}
                disabled={sending || eligible.length === 0 || finished}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : `Send ${eligible.length} email${eligible.length === 1 ? "" : "s"}`}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {!sending && !finished && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/75">
                {mode === "unsent"
                  ? "This will send the current status email to every application that has a final status and has not received its status email yet."
                  : "This will send the current status email to the selected applications, including any that were already emailed."}
              </p>
              {typeof totalAvailable === "number" && totalAvailable > eligible.length && (
                <p className="mt-2 text-sm text-amber-200">
                  Showing the first {eligible.length} of {totalAvailable} matching applications. Narrow the
                  filters and run the send again to reach the rest.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(["accepted", "waitlisted", "denied"] as const).map((status) => (
                <div key={status} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">{STATUS_LABELS[status]}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{counts[status] ?? 0}</p>
                </div>
              ))}
            </div>

            {eligible.length > 0 ? (
              <div className="rounded-xl border border-white/10">
                <p className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Recipients
                </p>
                <ul className="divide-y divide-white/10">
                  {eligible.slice(0, 6).map((target) => (
                    <li key={target.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate font-medium text-white">{target.fullName}</span>
                      <span className="truncate text-xs text-white/45">{target.email}</span>
                    </li>
                  ))}
                  {eligible.length > 6 && (
                    <li className="px-4 py-2.5 text-xs text-white/45">
                      and {eligible.length - 6} more...
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  No applications with a final status
                </div>
                <p className="mt-1 text-amber-100/80">
                  Set accepted, waitlisted, or denied before sending status emails.
                </p>
              </div>
            )}
          </>
        )}

        {(sending || finished) && (
          <div className="space-y-4" aria-busy={sending}>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-white">
                  {sending ? "Sending emails" : "Send complete"}
                </span>
                <span className="tabular-nums text-white/60">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total || 1}
                aria-valuenow={progress.current}
                aria-label="Email sending progress"
                className="h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-[width] motion-reduce:transition-none"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-200/60">Sent</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-200">{progress.sent}</p>
              </div>
              <div className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3">
                <p className="text-xs uppercase tracking-wide text-rose-200/60">Failed</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-rose-200">{progress.failed}</p>
              </div>
              <div className="rounded-lg border border-sky-400/20 bg-sky-400/5 p-3">
                <p className="text-xs uppercase tracking-wide text-sky-200/60">Simulated</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-sky-200">{progress.simulated}</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-white/45">Skipped</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white/75">{progress.skipped}</p>
              </div>
            </div>

            {progress.simulated > 0 && (
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-sky-100">
                Email sending is disabled on this environment. These messages were simulated and logged.
              </div>
            )}

            {warningResults.length > 0 && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/5">
                <p className="border-b border-amber-400/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-amber-200">
                  Warnings
                </p>
                <ul className="max-h-56 divide-y divide-amber-400/10 overflow-y-auto">
                  {warningResults.map((result) => (
                    <li key={result.applicationId} className="px-4 py-2.5 text-sm">
                      <p className="font-medium text-white">{result.fullName}</p>
                      <p className="text-xs text-amber-100/80">{result.warning}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {failedResults.length > 0 && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-400/5">
                <p className="border-b border-rose-400/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-rose-200">
                  Failed recipients
                </p>
                <ul className="max-h-56 divide-y divide-rose-400/10 overflow-y-auto">
                  {failedResults.map((result) => (
                    <li key={result.applicationId} className="px-4 py-2.5 text-sm">
                      <p className="font-medium text-white">{result.fullName}</p>
                      <p className="text-xs text-rose-200/80">{result.error ?? "Unknown error"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {finished && failedResults.length === 0 && progress.simulated === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                <Mail className="h-4 w-4" />
                {progress.sent === 0 && progress.skipped > 0
                  ? "No new emails were needed; the selected recipients were already emailed."
                  : "All eligible status emails were sent."}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
