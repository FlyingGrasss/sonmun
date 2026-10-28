"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncApplicationsAction } from "@/app/admin/applications/actions";
import { APPLICATION_TYPES, type ApplicationType, type SyncApplicationTypeResult } from "@/lib/applications/types";
import Modal from "./Modal";

function emptyResult(type: ApplicationType, error: string): SyncApplicationTypeResult {
  return {
    ok: false,
    type,
    fetchedRows: 0,
    headerMatched: false,
    parsed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    warnings: [],
    error,
  };
}

export default function SyncDialog({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [currentType, setCurrentType] = useState<ApplicationType | null>(null);
  const [results, setResults] = useState<SyncApplicationTypeResult[]>([]);

  const handleSync = async () => {
    setRunning(true);
    const collected: SyncApplicationTypeResult[] = [];
    for (const type of APPLICATION_TYPES) {
      setCurrentType(type);
      try {
        const response = await syncApplicationsAction(type);
        collected.push(response.ok ? response.summary : emptyResult(type, response.error));
      } catch {
        collected.push(emptyResult(type, "The sync request failed."));
      }
      setResults([...collected]);
    }
    setCurrentType(null);
    setRunning(false);
    onComplete();
  };

  const totals = results.reduce(
    (sum, result) => ({
      created: sum.created + result.created,
      updated: sum.updated + result.updated,
      unchanged: sum.unchanged + result.unchanged,
      skipped: sum.skipped + result.skipped,
      warnings: sum.warnings + result.warnings.length,
    }),
    { created: 0, updated: 0, unchanged: 0, skipped: 0, warnings: 0 }
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sync applications from Google Sheets"
      description="Import existing submissions into the database. Status, committee, notes, and email history are preserved."
      size="xl"
      pending={running}
      dismissible={!running}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${running ? "animate-spin motion-reduce:animate-none" : ""}`} />
            {running ? `Syncing ${currentType ?? ""}...` : "Sync all sheets"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
          <p>
            The five sheets are read with the existing read-only service account. Each type is synced
            separately so a slow sheet does not block the others. Re-running a sync is safe: rows are
            matched by a stable source key and workflow fields are never overwritten.
          </p>
        </div>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "New", value: totals.created, className: "text-emerald-200" },
                { label: "Updated", value: totals.updated, className: "text-sky-200" },
                { label: "Unchanged", value: totals.unchanged, className: "text-white/70" },
                { label: "Skipped", value: totals.skipped, className: "text-amber-200" },
                { label: "Warnings", value: totals.warnings, className: "text-rose-200" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">{item.label}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${item.className}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Sheet</th>
                    <th scope="col" className="px-4 py-3">Rows</th>
                    <th scope="col" className="px-4 py-3">Parsed</th>
                    <th scope="col" className="px-4 py-3">New</th>
                    <th scope="col" className="px-4 py-3">Updated</th>
                    <th scope="col" className="px-4 py-3">Unchanged</th>
                    <th scope="col" className="px-4 py-3">Skipped</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {results.map((result) => (
                    <tr key={result.type}>
                      <td className="px-4 py-3 font-semibold capitalize">{result.type}</td>
                      <td className="px-4 py-3 tabular-nums text-white/70">{result.fetchedRows}</td>
                      <td className="px-4 py-3 tabular-nums text-white/70">{result.parsed}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-200">{result.created}</td>
                      <td className="px-4 py-3 tabular-nums text-sky-200">{result.updated}</td>
                      <td className="px-4 py-3 tabular-nums text-white/70">{result.unchanged}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-200">{result.skipped}</td>
                      <td className="px-4 py-3">
                        {result.ok ? (
                          <span className="text-emerald-200">
                            {result.headerMatched ? "Synced" : "Synced by position"}
                          </span>
                        ) : (
                          <span className="text-rose-200">{result.error ?? "Failed"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.some((result) => result.warnings.length > 0) && (
              <details className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-amber-100">
                  Review {totals.warnings} sync warning{totals.warnings === 1 ? "" : "s"}
                </summary>
                <ul className="mt-3 space-y-1.5 text-xs leading-5 text-amber-100/80">
                  {results.flatMap((result) =>
                    result.warnings.map((warning, index) => (
                      <li key={`${result.type}-${index}`}>
                        <span className="font-semibold capitalize">{result.type}:</span> {warning}
                      </li>
                    ))
                  )}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
