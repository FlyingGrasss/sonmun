"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Mail, Save, Send } from "lucide-react";
import {
  sendCustomEmailAction,
  sendStatusEmailAction,
  updateApplicationAction,
} from "@/app/admin/applications/actions";
import { createRequestId } from "@/lib/applications/requestId";
import {
  EMAIL_TEMPLATE_VARIABLES,
  buildTemplateVariables,
  renderTemplate,
  type EmailConference,
} from "@/lib/applications/emailTemplates";
import { formatDateTime } from "@/lib/applications/format";
import { isInternalQuestionKey, type QuestionDefinition } from "@/lib/questions";
import { DELEGATION_SHARED_FIELDS } from "@/lib/applicationSheetHeaders";
import { APPLICATION_STATUSES, type ApplicationDetail, type ApplicationPatch, type ApplicationStatus } from "@/lib/applications/types";
import Modal from "./Modal";
import StatusBadge, { STATUS_CONFIG } from "./StatusBadge";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatAnswer(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  const text = String(value).trim();
  return text || "—";
}

function choiceAnswer(answers: Record<string, unknown>) {
  const keys = Object.keys(answers)
    .filter((key) => /^choice\d+$/.test(key))
    .sort((first, second) => Number(first.replace("choice", "")) - Number(second.replace("choice", "")));
  if (keys.length === 0) return "—";
  return keys
    .map((key, index) => `${index + 1}. ${formatAnswer(answers[key])}`)
    .join(" · ");
}

function AnswerList({
  questions,
  answers,
}: {
  questions: QuestionDefinition[];
  answers: Record<string, unknown>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {questions.map((question) => {
        if (isInternalQuestionKey(question.id)) return null;
        const value =
          question.id === "choice" ? choiceAnswer(answers) : formatAnswer(answers[question.id]);
        return (
          <div key={question.id} className={question.type === "longText" ? "sm:col-span-2" : ""}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/45">
              {question.label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
              {value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function ApplicationDetailDialogContent({
  detail,
  onClose,
  onSaved,
  onEmailSent,
  conference,
}: {
  detail: ApplicationDetail;
  onClose: () => void;
  onSaved: () => void;
  onEmailSent: () => void;
  conference: EmailConference;
}) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>(detail.status);
  const [committee, setCommittee] = useState(detail.givenCommittee ?? "");
  const [allocation, setAllocation] = useState(detail.allocation ?? "");
  const [notes, setNotes] = useState(detail.notes ?? "");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [statusSending, setStatusSending] = useState(false);
  const [confirmStatusSend, setConfirmStatusSend] = useState(false);
  const [statusResult, setStatusResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [customSubject, setCustomSubject] = useState(`${conference.displayName} application update`);
  const [customBody, setCustomBody] = useState(`Dear ${detail.fullName},\n\n`);
  const [customSending, setCustomSending] = useState(false);
  const [confirmCustomSend, setConfirmCustomSend] = useState(false);
  const [customResult, setCustomResult] = useState<{ ok: boolean; message: string } | null>(null);
  const statusRequestIdRef = useRef<string | null>(null);
  const customRequestIdRef = useRef<string | null>(null);

  const open = true;
  const busy = saving || statusSending || customSending;

  const dirty =
    status !== detail.status ||
    committee !== (detail.givenCommittee ?? "") ||
    allocation !== (detail.allocation ?? "") ||
    notes !== (detail.notes ?? "");

  const requestClose = () => {
    if (busy) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!detail) return;
    const nextCommittee = committee.trim();
    const nextAllocation = allocation.trim();
    const nextNotes = notes.trim();
    const patch: ApplicationPatch = {};
    if (status !== detail.status) patch.status = status;
    if (committee !== (detail.givenCommittee ?? "")) patch.givenCommittee = nextCommittee || null;
    if (allocation !== (detail.allocation ?? "")) patch.allocation = nextAllocation || null;
    if (notes !== (detail.notes ?? "")) patch.notes = nextNotes || null;
    if (Object.keys(patch).length === 0) {
      setSaveResult({ ok: true, message: "No changes to save." });
      return;
    }

    setCommittee(nextCommittee);
    setAllocation(nextAllocation);
    setNotes(nextNotes);
    setSaving(true);
    setSaveResult(null);
    try {
      const response = await updateApplicationAction(detail.id, patch);
      if (!response.ok) {
        setSaveResult({ ok: false, message: response.error });
        return;
      }
      setSaveResult({ ok: true, message: "Application updated." });
      onSaved();
    } catch {
      setSaveResult({ ok: false, message: "The application could not be updated." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendStatus = async () => {
    if (!detail) return;
    const requestId = statusRequestIdRef.current ?? createRequestId();
    statusRequestIdRef.current = requestId;
    setStatusSending(true);
    setStatusResult(null);
    try {
      const response = await sendStatusEmailAction({
        applicationId: detail.id,
        requestId,
      });
      if (!response.ok) {
        setStatusResult({ ok: false, message: response.error });
        return;
      }
      const result = response.result;
      if (result.ok || result.simulated > 0) {
        setStatusResult({
          ok: true,
          message: result.results[0]?.warning ?? "Status email sent.",
        });
        statusRequestIdRef.current = null;
      } else {
        setStatusResult({
          ok: false,
          message: result.error ?? result.results[0]?.error ?? "The email could not be sent.",
        });
      }
      onEmailSent();
    } catch {
      setStatusResult({ ok: false, message: "The send request failed." });
    } finally {
      setStatusSending(false);
      setConfirmStatusSend(false);
    }
  };

  const handleSendCustom = async () => {
    if (!detail) return;
    if (!customSubject.trim() || !customBody.trim()) {
      setCustomResult({ ok: false, message: "A subject and message body are required." });
      return;
    }
    const requestId = customRequestIdRef.current ?? createRequestId();
    customRequestIdRef.current = requestId;
    setCustomSending(true);
    setCustomResult(null);
    try {
      const response = await sendCustomEmailAction({
        applicationId: detail.id,
        subject: customSubject,
        body: customBody,
        requestId,
      });
      if (!response.ok) {
        setCustomResult({ ok: false, message: response.error });
        return;
      }
      const result = response.result;
      if (result.ok || result.simulated > 0) {
        setCustomResult({
          ok: true,
          message: result.results[0]?.warning ?? "Custom email sent.",
        });
        customRequestIdRef.current = null;
      } else {
        setCustomResult({
          ok: false,
          message: result.error ?? result.results[0]?.error ?? "The email could not be sent.",
        });
      }
      onEmailSent();
    } catch {
      setCustomResult({ ok: false, message: "The send request failed." });
    } finally {
      setCustomSending(false);
      setConfirmCustomSend(false);
    }
  };

  const previewVariables = useMemo(() => {
    if (!detail) return null;
    return buildTemplateVariables({
      fullName: detail.fullName,
      email: detail.email,
      applicationType: detail.applicationType,
      applicationTitle: detail.applicationTitle,
      school: detail.school,
      givenCommittee: committee || null,
      allocation: allocation || null,
      status: "custom",
      conference,
    });
  }, [allocation, committee, conference, detail]);

  const answers = isRecord(detail?.answers) ? detail.answers : null;
  const summaryAnswers =
    answers && isRecord(answers.summary) ? (answers.summary as Record<string, unknown>) : null;
  const delegates =
    answers && Array.isArray(answers.delegates)
      ? (answers.delegates.filter(isRecord) as Record<string, unknown>[])
      : [];
  const summaryKeys = useMemo(() => {
    if (!detail || detail.applicationType !== "delegation") return new Set<string>();
    const keys = new Set<string>(DELEGATION_SHARED_FIELDS.map(({ summaryId }) => summaryId));
    for (const question of detail.questions) {
      if (question.id === "choice" || question.id.startsWith("delegate")) continue;
      keys.add(question.id);
    }
    return keys;
  }, [detail]);
  const delegateQuestions = useMemo(
    () => (detail?.applicationType === "delegation" ? detail.questions.filter((question) => !summaryKeys.has(question.id)) : []),
    [detail, summaryKeys]
  );

  const declaredDelegates = summaryAnswers?.numberOfDelegates;
  const declaredCount = typeof declaredDelegates === "number" ? declaredDelegates : Number(declaredDelegates);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title={detail?.fullName ?? "Application"}
      description={detail ? `${detail.applicationTitle} · ${detail.email}` : undefined}
      size="xl"
      pending={busy}
      dismissible={!busy}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/45">
            {detail ? `Created ${formatDateTime(detail.createdAt)}` : ""}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={busy}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
          {confirmDiscard && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <span>You have unsaved workflow changes.</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="rounded-lg border border-amber-200/30 px-3 py-1.5 font-semibold"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                  className="rounded-lg bg-rose-500 px-3 py-1.5 font-semibold text-white"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <section className="flex flex-wrap items-center gap-3">
            <StatusBadge status={detail.status} />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white/60">
              {detail.applicationTitle}
            </span>
            {detail.school && <span className="text-sm text-white/55">{detail.school}</span>}
          </section>

          <section className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Email</p>
              <p className="mt-1 break-all text-sm text-white">{detail.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Phone</p>
              <p className="mt-1 text-sm text-white">{detail.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">School / organization</p>
              <p className="mt-1 text-sm text-white">{detail.school ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Applied</p>
              <p className="mt-1 text-sm text-white">
                {detail.appliedAt
                  ? formatDateTime(detail.appliedAt)
                  : `Imported ${formatDateTime(detail.createdAt)}`}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold">Workflow</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
                  className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                >
                  {APPLICATION_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_CONFIG[value].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Committee</span>
                <input
                  type="text"
                  value={committee}
                  onChange={(event) => setCommittee(event.target.value)}
                  maxLength={120}
                  placeholder="e.g. UNESCO"
                  className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Allocation</span>
                <input
                  type="text"
                  value={allocation}
                  onChange={(event) => setAllocation(event.target.value)}
                  maxLength={120}
                  placeholder="e.g. France"
                  className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Internal notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
            {dirty && (
              <p className="text-xs text-amber-200">
                Save workflow changes before sending an email so the email uses the updated committee,
                allocation, and status.
              </p>
            )}
            {saveResult && (!saveResult.ok || !dirty) && (
              <p
                role="status"
                aria-live="polite"
                className={`rounded-lg border p-3 text-xs ${
                  saveResult.ok
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                    : "border-rose-400/25 bg-rose-400/10 text-rose-100"
                }`}
              >
                {saveResult.message}
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold">Answers</h3>
            {!answers ? (
              <p className="text-sm text-white/50">No answers were stored for this application.</p>
            ) : detail.applicationType === "delegation" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
                    Delegation summary
                  </p>
                  <AnswerList
                    questions={detail.questions.filter((question) => summaryKeys.has(question.id))}
                    answers={summaryAnswers ?? {}}
                  />
                </div>
                {Number.isFinite(declaredCount) && declaredCount !== delegates.length && (
                  <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-100">
                    The sheet declares {declaredCount} delegates but {delegates.length} delegate rows were
                    found. All rows were kept.
                  </p>
                )}
                <div className="space-y-2">
                  {delegates.map((delegate, index) => (
                    <details key={index} className="rounded-xl border border-white/10 bg-black/20">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white">
                        <span>
                          {formatAnswer(delegate.delegateFullName) === "—"
                            ? `Delegate ${index + 1}`
                            : formatAnswer(delegate.delegateFullName)}
                        </span>
                        <ChevronDown className="h-4 w-4 text-white/40" />
                      </summary>
                      <div className="border-t border-white/10 px-4 py-4">
                        <AnswerList questions={delegateQuestions} answers={delegate} />
                      </div>
                    </details>
                  ))}
                  {delegates.length === 0 && (
                    <p className="text-sm text-white/50">No delegate rows were stored.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <AnswerList questions={detail.questions} answers={answers} />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold">Email</h3>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Status email</p>
                  <p className="mt-1 text-xs text-white/50">
                    {detail.status === "pending"
                      ? "Set and save a final status before sending."
                      : detail.statusEmailSent
                        ? `Sent for the current status on ${formatDateTime(detail.lastEmailSentAt)}.`
                        : "Not sent for the current status."}
                  </p>
                </div>
                {!confirmStatusSend ? (
                  <button
                    type="button"
                    onClick={() => setConfirmStatusSend(true)}
                    disabled={busy || dirty || detail.status === "pending"}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    {detail.statusEmailSent ? "Resend status email" : "Send status email"}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-amber-100">
                      Send the {STATUS_CONFIG[detail.status].label.toLowerCase()} email to {detail.email}?
                    </span>
                    <button
                      type="button"
                      onClick={handleSendStatus}
                      disabled={statusSending}
                      className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-bold text-[var(--background)] disabled:opacity-50"
                    >
                      {statusSending ? "Sending..." : "Confirm send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmStatusSend(false)}
                      disabled={statusSending}
                      className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {statusResult && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-3 rounded-lg border p-3 text-xs ${
                    statusResult.ok
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                      : "border-rose-400/25 bg-rose-400/10 text-rose-100"
                  }`}
                >
                  {statusResult.message}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Custom email</p>
              <p className="mt-1 text-xs text-white/50">
                Logged in the email history but does not change the status-email state.
              </p>
              <div className="mt-4 space-y-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Subject</span>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(event) => setCustomSubject(event.target.value)}
                    maxLength={200}
                    className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Message</span>
                  <textarea
                    value={customBody}
                    onChange={(event) => setCustomBody(event.target.value)}
                    rows={6}
                    maxLength={10_000}
                    className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs leading-6 text-white outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TEMPLATE_VARIABLES.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      title={variable.description}
                      onClick={() =>
                        setCustomBody((current) => `${current}{{${variable.key}}}`)
                      }
                      className="rounded-md border border-white/10 bg-black/25 px-2 py-1 font-mono text-[11px] text-white/70 transition hover:border-[var(--color-accent)] hover:text-white"
                    >
                      {`{{${variable.key}}}`}
                    </button>
                  ))}
                </div>
                {previewVariables && (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Preview</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {renderTemplate(customSubject, previewVariables) || "No subject"}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-6 text-white/70">
                      {renderTemplate(customBody, previewVariables) || "No message"}
                    </pre>
                  </div>
                )}
                {!confirmCustomSend ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCustomSend(true)}
                    disabled={busy || dirty}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Mail className="h-4 w-4" />
                    Send custom email
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3">
                    <span className="text-xs text-amber-100">
                      Send this custom email to {detail.email}?
                    </span>
                    <button
                      type="button"
                      onClick={handleSendCustom}
                      disabled={customSending}
                      className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-bold text-[var(--background)] disabled:opacity-50"
                    >
                      {customSending ? "Sending..." : "Confirm send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCustomSend(false)}
                      disabled={customSending}
                      className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {customResult && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`rounded-lg border p-3 text-xs ${
                      customResult.ok
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                        : "border-rose-400/25 bg-rose-400/10 text-rose-100"
                    }`}
                  >
                    {customResult.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold">Email history</h3>
            {detail.emailLogs.length === 0 ? (
              <p className="text-sm text-white/50">No emails have been logged for this application.</p>
            ) : (
              <ul className="space-y-2">
                {detail.emailLogs.map((log) => (
                  <li key={log.id} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{log.subject}</span>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          log.status === "sent"
                            ? "text-emerald-200"
                            : log.status === "failed"
                              ? "text-rose-200"
                              : "text-sky-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {formatDateTime(log.sentAt)} · {log.recipient}
                      {log.templateKey ? ` · ${log.templateKey}` : ""}
                    </p>
                    {log.error && <p className="mt-1 text-xs text-rose-200/80">{log.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
      </div>
    </Modal>
  );
}

export default function ApplicationDetailDialog(props: {
  detail: ApplicationDetail | null;
  version: number;
  onClose: () => void;
  onSaved: () => void;
  onEmailSent: () => void;
  conference: EmailConference;
}) {
  if (!props.detail) return null;
  return (
    <ApplicationDetailDialogContent
      key={`${props.detail.id}:${props.version}`}
      detail={props.detail}
      onClose={props.onClose}
      onSaved={props.onSaved}
      onEmailSent={props.onEmailSent}
      conference={props.conference}
    />
  );
}
