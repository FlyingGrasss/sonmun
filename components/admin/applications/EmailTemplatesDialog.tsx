"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import { saveEmailTemplatesAction } from "@/app/admin/applications/actions";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_VARIABLES,
  buildTemplateVariables,
  renderTemplate,
  type EmailConference,
} from "@/lib/applications/emailTemplates";
import { EMAIL_STATUS_KEYS, type EmailStatusKey, type EmailTemplateView } from "@/lib/applications/types";
import Modal from "./Modal";

type LocalTemplates = Record<EmailStatusKey, { subject: string; body: string }>;

const STATUS_LABELS: Record<EmailStatusKey, string> = {
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  denied: "Denied",
};

function toLocal(templates: EmailTemplateView[]): LocalTemplates {
  return Object.fromEntries(
    EMAIL_STATUS_KEYS.map((statusKey) => {
      const template = templates.find((item) => item.statusKey === statusKey);
      return [
        statusKey,
        {
          subject: template?.subject ?? DEFAULT_EMAIL_TEMPLATES[statusKey].subject,
          body: template?.body ?? DEFAULT_EMAIL_TEMPLATES[statusKey].body,
        },
      ];
    })
  ) as LocalTemplates;
}

export default function EmailTemplatesDialog({
  open,
  onClose,
  templates,
  conference,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  templates: EmailTemplateView[];
  conference: EmailConference;
  onSaved: (templates: EmailTemplateView[]) => void;
}) {
  const [localTemplates, setLocalTemplates] = useState<LocalTemplates>(() => toLocal(templates));
  const [activeTab, setActiveTab] = useState<EmailStatusKey>("accepted");
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const initial = useMemo(() => toLocal(templates), [templates]);
  const dirty = JSON.stringify(localTemplates) !== JSON.stringify(initial);

  const requestClose = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const insertVariable = (key: string) => {
    const textarea = bodyRef.current;
    const token = `{{${key}}}`;
    if (!textarea) {
      setLocalTemplates((current) => ({
        ...current,
        [activeTab]: { ...current[activeTab], body: `${current[activeTab].body} ${token}` },
      }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const body = localTemplates[activeTab].body;
    const nextBody = `${body.slice(0, start)}${token}${body.slice(end)}`;
    setLocalTemplates((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], body: nextBody },
    }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await saveEmailTemplatesAction(localTemplates);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      const savedAt = new Date().toISOString();
      onSaved(
        EMAIL_STATUS_KEYS.map((statusKey) => ({
          statusKey,
          subject: localTemplates[statusKey].subject,
          body: localTemplates[statusKey].body,
          updatedAt: savedAt,
          isDefault: false,
        }))
      );
      toast.success("Email templates saved.");
      onClose();
    } catch {
      setError("The templates could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const previewVariables = buildTemplateVariables({
    fullName: "Ada Example",
    email: "ada@example.com",
    applicationType: "delegate",
    applicationTitle: "Delegate",
    school: "Example High School",
    givenCommittee: "UNESCO",
    allocation: "France",
    status: activeTab,
    conference,
  });

  const previewSubject = renderTemplate(localTemplates[activeTab].subject, previewVariables);
  const previewBody = renderTemplate(localTemplates[activeTab].body, previewVariables);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title="Email templates"
      description="These templates are used for status emails. Variables are replaced per application."
      size="xl"
      pending={saving}
      dismissible={!saving}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setLocalTemplates((current) => ({
                ...current,
                [activeTab]: { ...DEFAULT_EMAIL_TEMPLATES[activeTab] },
              }));
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200 transition hover:text-rose-100 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset this template
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={saving}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save templates"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100"
          >
            {error}
          </div>
        )}

        {confirmDiscard && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <span>You have unsaved template changes.</span>
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

        <div role="tablist" aria-label="Email templates" className="flex flex-wrap gap-2">
          {EMAIL_STATUS_KEYS.map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              role="tab"
              id={`template-tab-${statusKey}`}
              aria-selected={activeTab === statusKey}
              aria-controls="template-panel"
              onClick={() => setActiveTab(statusKey)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === statusKey
                  ? "bg-[var(--color-accent)] text-[var(--background)]"
                  : "border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              {STATUS_LABELS[statusKey]}
            </button>
          ))}
        </div>

        <div
          id="template-panel"
          role="tabpanel"
          aria-labelledby={`template-tab-${activeTab}`}
          className="grid gap-5 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="template-subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Subject
              </label>
              <input
                id="template-subject"
                type="text"
                value={localTemplates[activeTab].subject}
                onChange={(event) =>
                  setLocalTemplates((current) => ({
                    ...current,
                    [activeTab]: { ...current[activeTab], subject: event.target.value },
                  }))
                }
                maxLength={200}
                className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <label htmlFor="template-body" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Message body
              </label>
              <textarea
                ref={bodyRef}
                id="template-body"
                rows={16}
                value={localTemplates[activeTab].body}
                onChange={(event) =>
                  setLocalTemplates((current) => ({
                    ...current,
                    [activeTab]: { ...current[activeTab], body: event.target.value },
                  }))
                }
                maxLength={10_000}
                className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-xs leading-6 text-white outline-none focus:border-[var(--color-accent)]"
              />
              <p className="mt-1 text-xs text-white/40">
                Plain text. Blank lines become paragraphs; single line breaks are preserved.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                Variables
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    title={variable.description}
                    onClick={() => insertVariable(variable.key)}
                    className="rounded-md border border-white/10 bg-black/25 px-2 py-1 font-mono text-[11px] text-white/75 transition hover:border-[var(--color-accent)] hover:text-white"
                  >
                    {`{{${variable.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Preview</p>
            <p className="mt-3 border-b border-white/10 pb-3 text-sm font-semibold text-white">
              {previewSubject || "No subject"}
            </p>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-white/75">
              {previewBody || "No message body"}
            </pre>
            <p className="mt-4 text-xs text-white/40">
              Preview uses sample data. The actual email also includes the SONMUN header and footer.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
