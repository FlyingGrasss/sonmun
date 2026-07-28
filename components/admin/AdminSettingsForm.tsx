"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Copy, Plus, Save, Trash2, X } from "lucide-react";
import { getApplicationSheetHeaders } from "@/lib/applicationSheetHeaders";
import { questionTextForEditor, questionTextFromEditor } from "@/lib/questionText";
import type { EditableSettings } from "@/lib/siteSettings";

type SaveAction = (formData: FormData) => void | Promise<void>;
type QuestionRow = { key: string; text: string };
type QuestionGroup = { type: string; rows: QuestionRow[] };

const inputClass = "rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]";

function Field({ label, name, value, type = "text", required = false }: { label: string; name: string; value: string | number; type?: string; required?: boolean }) {
  return <label className="flex flex-col gap-2 text-sm text-white">{label}<input className={inputClass} name={name} type={type} defaultValue={value} required={required} /></label>;
}

function TextField({ label, name, value, rows = 4 }: { label: string; name: string; value: string; rows?: number }) {
  return <label className="flex flex-col gap-2 text-sm text-white">{label}<textarea className={inputClass} name={name} rows={rows} defaultValue={value} /></label>;
}

function CollapsibleSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return <details id={id} className="rounded-xl border border-white/10 bg-black/25"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-2xl font-bold [&::-webkit-details-marker]:hidden">{title}<ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" /></summary><div className="border-t border-white/10 p-6">{children}</div></details>;
}

function DateField({ value }: { value: string }) {
  const initialValue = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)?.[0] ?? "";
  const [isoValue, setIsoValue] = useState(value);
  const handleChange = (nextValue: string) => {
    if (!nextValue) { setIsoValue(""); return; }
    const date = new Date(nextValue);
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
    const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
    setIsoValue(`${nextValue}:00${sign}${hours}:${minutes}`);
  };
  return <label className="flex flex-col gap-2 text-sm text-white">Conference starts<input className={inputClass} name="startDatePicker" type="datetime-local" defaultValue={initialValue} onChange={(event) => handleChange(event.target.value)} required /><input type="hidden" name="startDateIso" value={isoValue} /><span className="text-xs text-white/55">Choose the local conference start time. The site converts it to ISO automatically.</span></label>;
}

function readableQuestionName(key: string) {
  if (key.startsWith("customQuestion")) return "Additional question";
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/(\d+)/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function initialQuestionGroups(settings: EditableSettings): QuestionGroup[] {
  return Object.entries(settings.questions).map(([type, questions]) => ({
    type,
    rows: Object.entries(questions).map(([key, text]) => ({ key, text: questionTextForEditor(text) })),
  }));
}

function QuestionEditor({ type, index, row, onChange, onDelete }: { type: string; index: number; row: QuestionRow; onChange: (text: string) => void; onDelete: () => void }) {
  const isLong = row.text.length > 90 || /answer|experience|motivation|additional|reference/i.test(row.key);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/15 p-4">
      <input type="hidden" name={`question_${type}_${index}_key`} value={row.key} />
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-white">
        {readableQuestionName(row.key)}
        <textarea name={`question_${type}_${index}_text`} value={row.text} onChange={(event) => onChange(event.target.value)} rows={isLong ? 5 : 2} required className={inputClass} />
      </label>
      <button type="button" onClick={onDelete} title="Delete question" aria-label={`Delete ${readableQuestionName(row.key)}`} className="mt-7 shrink-0 rounded-lg border border-red-300/30 p-2 text-red-100 hover:border-red-300 hover:bg-red-400/10">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function SheetHeaderPreview({ applicationType, text }: { applicationType: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={`sheet-header-${applicationType}`} className="text-sm font-semibold text-white">Google Sheets header: {applicationType}</label>
        <button type="button" onClick={copyText} title="Copy header" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[var(--color-accent)]">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea id={`sheet-header-${applicationType}`} readOnly value={text} onFocus={(event) => event.currentTarget.select()} rows={3} className={`${inputClass} w-full text-xs`} aria-label={`${applicationType} Google Sheets header`} />
      <p className="mt-2 text-xs text-white/55">Copy this entire line and paste it into cell A1 of the matching sheet.</p>
    </div>
  );
}

export default function AdminSettingsForm({ settings, action }: { settings: EditableSettings; action: SaveAction }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>(() => initialQuestionGroups(settings));

  const sheetHeaders = useMemo(() => {
    const questions = Object.fromEntries(questionGroups.map((group) => [
      group.type,
      Object.fromEntries(group.rows.filter((row) => row.text.trim()).map((row) => [row.key, questionTextFromEditor(row.text)])),
    ]));
    return getApplicationSheetHeaders(questions, settings.form);
  }, [questionGroups, settings.form]);

  useEffect(() => {
    const mountFrame = window.requestAnimationFrame(() => setMounted(true));
    const handleBeforeUnload = (event: BeforeUnloadEvent) => { if (isDirty) { event.preventDefault(); event.returnValue = ""; } };
    const handleLinkClick = (event: MouseEvent) => {
      if (!isDirty) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault(); setPendingHref(url.href); setIsLeaveModalOpen(true);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => { window.cancelAnimationFrame(mountFrame); window.removeEventListener("beforeunload", handleBeforeUnload); document.removeEventListener("click", handleLinkClick, true); };
  }, [isDirty]);

  const updateQuestion = (type: string, index: number, text: string) => {
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: group.rows.map((row, rowIndex) => rowIndex === index ? { ...row, text } : row) } : group));
  };
  const addQuestion = (type: string) => {
    const existingKeys = new Set(questionGroups.flatMap((group) => group.rows.map((row) => row.key)));
    let suffix = 1;
    while (existingKeys.has(`customQuestion${suffix}`)) suffix += 1;
    const key = `customQuestion${suffix}`;
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: [...group.rows, { key, text: "" }] } : group));
    setIsDirty(true);
  };
  const deleteQuestion = (type: string, index: number) => {
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: group.rows.filter((_, rowIndex) => rowIndex !== index) } : group));
    setIsDirty(true);
  };
  const leavePage = () => { if (!pendingHref) return; setIsDirty(false); setIsLeaveModalOpen(false); window.location.assign(pendingHref); };

  const saveButton = <button type="submit" form="conference-settings-form" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--background)] shadow-2xl ring-2 ring-black/20 hover:bg-white" style={{ position: "fixed", right: "1.5rem", bottom: "1.5rem", zIndex: 1000 }}><Save className="h-5 w-5" aria-hidden="true" />Save changes</button>;

  return <>
    <form id="conference-settings-form" action={action} onChange={() => setIsDirty(true)} onSubmit={() => setIsDirty(false)} className="flex flex-col gap-6">
      <CollapsibleSection id="conference-details" title="Conference Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" name="brandName" value={settings.conference.brandName} required /><Field label="Short name" name="shortName" value={settings.conference.shortName} required /><Field label="Display name" name="displayName" value={settings.conference.displayName} required /><Field label="Year" name="year" type="number" value={settings.conference.year} required /><Field label="Dates" name="dates" value={settings.conference.dates} required /><DateField value={settings.conference.startDateIso} /><Field label="Full name" name="fullName" value={settings.conference.fullName} required /><Field label="Session name" name="sessionName" value={settings.conference.sessionName} required /><Field label="Hashtag" name="hashtag" value={settings.conference.hashtag} required /><Field label="Site URL" name="siteUrl" value={settings.conference.siteUrl} required /><Field label="City" name="locationCity" value={settings.conference.location.city} /><Field label="Country" name="locationCountry" value={settings.conference.location.country} /><Field label="Organizer name" name="organizerName" value={settings.conference.organizer.name} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm text-white"><input name="committeesEnabled" type="checkbox" defaultChecked={settings.pages.committeesEnabled} /> Show Committees page</label><label className="flex items-center gap-2 text-sm text-white"><input name="secretariatEnabled" type="checkbox" defaultChecked={settings.pages.secretariatEnabled} /> Show Secretariat page</label></div>
      </CollapsibleSection>

      <CollapsibleSection id="form-rules" title="Form Rules"><p className="mb-5 text-sm text-white/65">These values control the limits shown to applicants and used by the application forms.</p><div className="grid gap-4 sm:grid-cols-3"><Field label="Minimum motivation words" name="minimumMotivationWords" type="number" value={settings.form.minimumMotivationWords} required /><Field label="Minimum delegation size" name="minimumDelegates" type="number" value={settings.form.minimumDelegates} required /><Field label="Committee choices shown" name="committeePreferenceCount" type="number" value={settings.form.committeePreferenceCount} required /></div></CollapsibleSection>

      <CollapsibleSection id="application-settings" title="Applications"><p className="mb-5 text-sm text-white/65">Disabled application types disappear from the application page and reject direct form/API access.</p><div className="grid gap-5">{settings.applications.map((application) => <details key={application.id} className="rounded-lg border border-white/10 bg-white/5 p-4"><summary className="flex cursor-pointer list-none items-center justify-between px-2 text-lg font-semibold capitalize [&::-webkit-details-marker]:hidden">{application.id}<ChevronDown className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" /></summary><div className="mt-4 grid gap-4"><label className="flex items-center gap-2 text-sm text-white"><input name={`application_${application.id}_enabled`} type="checkbox" defaultChecked={application.enabled} /> Enabled</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Card title" name={`application_${application.id}_title`} value={application.title} required /><Field label="Form title" name={`application_${application.id}_formTitle`} value={application.formTitle} required /></div><TextField label="Description" name={`application_${application.id}_description`} value={application.description} rows={3} /></div></details>)}</div></CollapsibleSection>

      <CollapsibleSection id="letters-settings" title="Letters Page"><div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Title prefix" name="lettersTitlePrefix" value={settings.letters.titlePrefix} /><Field label="Highlighted title" name="lettersTitleHighlight" value={settings.letters.titleHighlight} /></div><TextField label="Opening" name="lettersOpening" value={settings.letters.opening} rows={3} /><TextField label="Paragraphs (separate paragraphs with a blank line)" name="lettersParagraphs" value={settings.letters.paragraphs.join("\n\n")} rows={10} /></div></CollapsibleSection>

      <CollapsibleSection id="question-settings" title="Application Questions"><p className="mb-5 text-sm text-white/65">Edit the complete text of every question. Add a new question to show an extra text field on that application, or delete a question to remove it. Readable markers such as [minimum motivation words] are converted automatically using Form Rules.</p><div className="grid gap-5">{questionGroups.map((group) => <details key={group.type} className="rounded-lg border border-white/10 bg-white/5 p-4"><summary className="flex cursor-pointer list-none items-center justify-between px-2 text-lg font-semibold capitalize [&::-webkit-details-marker]:hidden">{group.type}<ChevronDown className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" /></summary><div className="mt-4 grid gap-4"><input type="hidden" name={`question_${group.type}_count`} value={group.rows.length} />{group.rows.map((row, index) => <QuestionEditor key={row.key} type={group.type} index={index} row={row} onChange={(text) => updateQuestion(group.type, index, text)} onDelete={() => deleteQuestion(group.type, index)} />)}<button type="button" onClick={() => addQuestion(group.type)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:border-[var(--color-accent)]"><Plus className="h-4 w-4" aria-hidden="true" />Add question</button></div></details>)}</div>{sheetHeaders.map((row) => <SheetHeaderPreview key={row.applicationType} applicationType={row.applicationType} text={row.text} />)}</CollapsibleSection>
    </form>

    {isDirty && mounted && createPortal(saveButton, document.body)}
    {isLeaveModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"><div className="w-full max-w-md rounded-xl border border-white/15 bg-[var(--background)] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-[var(--color-accent)]" aria-hidden="true" /><div><h2 id="unsaved-title" className="text-xl font-bold">You have unsaved changes</h2><p className="mt-2 text-sm text-white/70">Are you sure you want to leave?</p></div></div><button type="button" onClick={() => setIsLeaveModalOpen(false)} aria-label="Close" className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsLeaveModalOpen(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:border-[var(--color-accent)]">Stay</button><button type="button" onClick={leavePage} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] hover:bg-white">Leave</button></div></div></div>}
  </>;
}
