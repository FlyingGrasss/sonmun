"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, ChevronDown, Copy, Plus, Save, Trash2, X } from "lucide-react";
import { getApplicationSheetHeaders } from "@/lib/applicationSheetHeaders";
import { isInternalQuestionKey, QUESTION_TYPES, type QuestionDefinition, type QuestionType } from "@/lib/questions";
import type { EditableLetter, EditableSettings } from "@/lib/siteSettings";

type SaveAction = (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
type QuestionRow = QuestionDefinition;
type QuestionGroup = { type: string; rows: QuestionRow[] };
type LetterRow = EditableLetter;

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

function initialQuestionGroups(settings: EditableSettings): QuestionGroup[] {
  return Object.entries(settings.questions).map(([type, questions]) => ({
    type,
    rows: questions.filter((question) => !isInternalQuestionKey(question.id)),
  }));
}

function QuestionEditor({ type, index, total, row, onChange, onDelete, onMove }: { type: string; index: number; total: number; row: QuestionRow; onChange: (changes: Partial<QuestionRow>) => void; onDelete: () => void; onMove: (direction: -1 | 1) => void }) {
  const prefix = `question_${type}_${index}`;
  return (
    <div className="grid gap-4 rounded-lg border border-white/10 bg-black/15 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
      <input type="hidden" name={`${prefix}_id`} value={row.id} />
      <label className="flex flex-col gap-2 text-sm text-white md:col-span-2">
        Question text
        <textarea name={`${prefix}_label`} value={row.label} onChange={(event) => onChange({ label: event.target.value })} rows={3} required className={inputClass} />
      </label>
      <div className="flex items-end justify-end gap-2">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} title="Move question up" aria-label="Move question up" className="rounded-lg border border-white/20 p-2 text-white/75 hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} title="Move question down" aria-label="Move question down" className="rounded-lg border border-white/20 p-2 text-white/75 hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={onDelete} title="Delete question" aria-label="Delete question" className="rounded-lg border border-red-300/30 p-2 text-red-100 hover:border-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <label className="flex flex-col gap-2 text-sm text-white">
        Question type
        <select name={`${prefix}_type`} value={row.type} onChange={(event) => onChange({ type: event.target.value as QuestionType })} className={inputClass}>
          {QUESTION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-white">
        <input name={`${prefix}_required`} type="checkbox" checked={row.required} onChange={(event) => onChange({ required: event.target.checked })} />
        Required
      </label>
      <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
        <label className="flex flex-col gap-2 text-sm text-white">
          Minimum words (0 = off)
          <input name={`${prefix}_minWords`} type="number" min="0" value={row.minWords} onChange={(event) => onChange({ minWords: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white">
          Minimum characters (0 = off)
          <input name={`${prefix}_minCharacters`} type="number" min="0" value={row.minCharacters} onChange={(event) => onChange({ minCharacters: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-white md:col-span-2">
        Placeholder (optional)
        <input name={`${prefix}_placeholder`} value={row.placeholder} onChange={(event) => onChange({ placeholder: event.target.value })} className={inputClass} />
      </label>
      {row.type === "dropdown" && (
        <label className="flex flex-col gap-2 text-sm text-white md:col-span-3">
          Dropdown options (one option per line)
          <textarea name={`${prefix}_options`} value={row.options.join("\n")} onChange={(event) => onChange({ options: event.target.value.split(/\r?\n/).map((option) => option.trim()).filter(Boolean) })} rows={4} className={inputClass} />
        </label>
      )}
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
  return <div className="mt-6 border-t border-white/10 pt-5"><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor={`sheet-header-${applicationType}`} className="text-sm font-semibold text-white">Google Sheets header: {applicationType}</label><button type="button" onClick={copyText} title="Copy header" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[var(--color-accent)]">{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button></div><textarea id={`sheet-header-${applicationType}`} readOnly value={text} onFocus={(event) => event.currentTarget.select()} rows={3} className={`${inputClass} w-full text-xs`} aria-label={`${applicationType} Google Sheets header`} /><p className="mt-2 text-xs text-white/55">Copy this entire line and paste it into cell A1 of the matching sheet.</p></div>;
}

export default function AdminSettingsForm({ settings, action }: { settings: EditableSettings; action: SaveAction }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>(() => initialQuestionGroups(settings));
  const [letterEntries, setLetterEntries] = useState<LetterRow[]>(() => settings.letters.entries.map((letter) => ({ ...letter, paragraphs: [...letter.paragraphs] })));

  const sheetHeaders = useMemo(() => {
    const questions = Object.fromEntries(questionGroups.map((group) => [
      group.type,
      group.rows.filter((row) => row.label.trim()),
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
      event.preventDefault();
      setPendingHref(url.href);
      setIsLeaveModalOpen(true);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => { window.cancelAnimationFrame(mountFrame); window.removeEventListener("beforeunload", handleBeforeUnload); document.removeEventListener("click", handleLinkClick, true); };
  }, [isDirty]);

  const updateQuestion = (type: string, index: number, changes: Partial<QuestionRow>) => {
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: group.rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row) } : group));
    setIsDirty(true);
  };

  const addQuestion = (type: string) => {
    const existingKeys = new Set(questionGroups.flatMap((group) => group.rows.map((row) => row.id)));
    let suffix = 1;
    while (existingKeys.has(`customQuestion${suffix}`)) suffix += 1;
    const id = `customQuestion${suffix}`;
    const row: QuestionRow = { id, label: "", type: "shortText", required: false, placeholder: "", options: [], minWords: 0, minCharacters: 0 };
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: [...group.rows, row] } : group));
    setIsDirty(true);
  };

  const deleteQuestion = (type: string, index: number) => {
    setQuestionGroups((groups) => groups.map((group) => group.type === type ? { ...group, rows: group.rows.filter((_, rowIndex) => rowIndex !== index) } : group));
    setIsDirty(true);
  };

  const moveQuestion = (type: string, index: number, direction: -1 | 1) => {
    setQuestionGroups((groups) => groups.map((group) => {
      if (group.type !== type) return group;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= group.rows.length) return group;
      const rows = [...group.rows];
      [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];
      return { ...group, rows };
    }));
    setIsDirty(true);
  };

  const updateLetter = (index: number, changes: Partial<LetterRow>) => {
    setLetterEntries((entries) => entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...changes } : entry));
    setIsDirty(true);
  };

  const addLetter = () => {
    const existingIds = new Set(letterEntries.map((letter) => letter.id));
    let suffix = letterEntries.length + 1;
    while (existingIds.has(`letter-${suffix}`)) suffix += 1;
    setLetterEntries((entries) => [...entries, {
      id: `letter-${suffix}`,
      titlePrefix: "Letter From The",
      titleHighlight: "New Letter",
      opening: "Dear Participants",
      paragraphs: [],
      author: "",
    }]);
    setIsDirty(true);
  };

  const deleteLetter = (index: number) => {
    setLetterEntries((entries) => entries.filter((_, entryIndex) => entryIndex !== index));
    setIsDirty(true);
  };

  const moveLetter = (index: number, direction: -1 | 1) => {
    setLetterEntries((entries) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= entries.length) return entries;
      const nextEntries = [...entries];
      [nextEntries[index], nextEntries[nextIndex]] = [nextEntries[nextIndex], nextEntries[index]];
      return nextEntries;
    });
    setIsDirty(true);
  };

  const leavePage = () => { if (!pendingHref) return; setIsDirty(false); setIsLeaveModalOpen(false); window.location.assign(pendingHref); };
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      const result = await action(new FormData(event.currentTarget));
      if (!result.ok) {
        setSaveMessage(result.message || "Could not save changes.");
        return;
      }
      setIsDirty(false);
      setSaveMessage("Changes saved.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  };
  const markDirty = () => { setIsDirty(true); setSaveMessage(""); };
  const saveButton = <button type="submit" form="conference-settings-form" disabled={isSaving} className="fixed bottom-6 right-6 z-[1000] inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--background)] shadow-2xl ring-2 ring-black/20 hover:bg-white disabled:cursor-wait disabled:opacity-60"><Save className="h-5 w-5" aria-hidden="true" />{isSaving ? "Saving..." : "Save changes"}</button>;
  const leaveModal = <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"><div className="w-full max-w-md rounded-xl border border-white/15 bg-[var(--background)] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-[var(--color-accent)]" aria-hidden="true" /><div><h2 id="unsaved-title" className="text-xl font-bold">You have unsaved changes</h2><p className="mt-2 text-sm text-white/70">Are you sure you want to leave?</p></div></div><button type="button" onClick={() => setIsLeaveModalOpen(false)} aria-label="Close" className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsLeaveModalOpen(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:border-[var(--color-accent)]">Stay</button><button type="button" onClick={leavePage} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-bold text-[var(--background)] hover:bg-white">Leave</button></div></div></div>;

  return <>
    <form id="conference-settings-form" onChange={markDirty} onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      {saveMessage && <p role="status" className="text-sm text-[var(--color-accent)]">{saveMessage}</p>}
      <CollapsibleSection id="conference-details" title="Conference Details">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Brand name" name="brandName" value={settings.conference.brandName} required /><Field label="Short name" name="shortName" value={settings.conference.shortName} required /><Field label="Display name" name="displayName" value={settings.conference.displayName} required /><Field label="Year" name="year" type="number" value={settings.conference.year} required /><Field label="Dates" name="dates" value={settings.conference.dates} required /><DateField value={settings.conference.startDateIso} /><Field label="Full name" name="fullName" value={settings.conference.fullName} required /><Field label="Session name" name="sessionName" value={settings.conference.sessionName} required /><Field label="Hashtag" name="hashtag" value={settings.conference.hashtag} required /><Field label="Site URL" name="siteUrl" value={settings.conference.siteUrl} required /><div className="flex flex-col gap-2"><Field label="Email sender" name="senderEmail" type="email" value={settings.conference.senderEmail} required /><span className="text-xs text-white/55">Use an address from a domain verified in Resend. New installations start with onboarding@resend.dev.</span></div><Field label="City" name="locationCity" value={settings.conference.location.city} /><Field label="Country" name="locationCountry" value={settings.conference.location.country} /><Field label="Organizer name" name="organizerName" value={settings.conference.organizer.name} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Minimum Delegation Delegates" name="minimumDelegates" type="number" value={settings.form.minimumDelegates} required /></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm text-white"><input name="committeesEnabled" type="checkbox" defaultChecked={settings.pages.committeesEnabled} /> Show Committees page</label><label className="flex items-center gap-2 text-sm text-white"><input name="secretariatEnabled" type="checkbox" defaultChecked={settings.pages.secretariatEnabled} /> Show Executive Team page</label></div>
      </CollapsibleSection>

      <CollapsibleSection id="application-settings" title="Applications"><p className="mb-5 text-sm text-white/65">Disable an application to remove it from the site and reject direct access to its form.</p><div className="grid gap-5">{settings.applications.map((application) => <details key={application.id} className="rounded-lg border border-white/10 bg-white/5 p-4"><summary className="flex cursor-pointer list-none items-center justify-between px-2 text-lg font-semibold capitalize [&::-webkit-details-marker]:hidden">{application.title || application.id}<ChevronDown className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" /></summary><div className="mt-4 grid gap-4"><label className="flex items-center gap-2 text-sm text-white"><input name={`application_${application.id}_enabled`} type="checkbox" defaultChecked={application.enabled} /> Enabled</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Card title" name={`application_${application.id}_title`} value={application.title} required /><Field label="Form title" name={`application_${application.id}_formTitle`} value={application.formTitle} required /></div><TextField label="Description" name={`application_${application.id}_description`} value={application.description} rows={3} /></div></details>)}</div></CollapsibleSection>

      <CollapsibleSection id="letters-settings" title="Letters Page"><p className="mb-5 text-sm text-white/65">Each letter appears in its own titled box. Add, delete, or reorder letters with the controls, then edit each letter&apos;s title and content below.</p><input type="hidden" name="lettersCount" value={letterEntries.length} /><div className="grid gap-5">{letterEntries.map((letter, index) => <div key={`${letter.id}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Letter {index + 1}</h3><div className="flex items-center gap-2"><button type="button" onClick={() => moveLetter(index, -1)} disabled={index === 0} title="Move letter up" aria-label="Move letter up" className="rounded-lg border border-white/20 p-2 text-white/75 hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => moveLetter(index, 1)} disabled={index === letterEntries.length - 1} title="Move letter down" aria-label="Move letter down" className="rounded-lg border border-white/20 p-2 text-white/75 hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => deleteLetter(index)} title="Delete letter" aria-label="Delete letter" className="rounded-lg border border-red-300/30 p-2 text-red-100 hover:border-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></div><input type="hidden" name={`letter_${index}_id`} value={letter.id} /><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm text-white">Title before accent<input name={`letter_${index}_titlePrefix`} value={letter.titlePrefix} onChange={(event) => updateLetter(index, { titlePrefix: event.target.value })} className={inputClass} required /></label><label className="flex flex-col gap-2 text-sm text-white">Highlighted title<input name={`letter_${index}_titleHighlight`} value={letter.titleHighlight} onChange={(event) => updateLetter(index, { titleHighlight: event.target.value })} className={inputClass} required /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm text-white">Opening<input name={`letter_${index}_opening`} value={letter.opening} onChange={(event) => updateLetter(index, { opening: event.target.value })} className={inputClass} required /></label><label className="flex flex-col gap-2 text-sm text-white">Author / Sign-off title (optional)<input name={`letter_${index}_author`} value={letter.author ?? ""} onChange={(event) => updateLetter(index, { author: event.target.value })} placeholder="Defaults to Organizer Name if blank" className={inputClass} /></label></div><label className="mt-4 flex flex-col gap-2 text-sm text-white">Letter paragraphs <span className="text-xs text-white/55">Separate paragraphs with a blank line. You can use {`{sessionName}`}, {`{dates}`}, and {`{shortName}`} for conference details.</span><textarea name={`letter_${index}_paragraphs`} value={letter.paragraphs.join("\n\n")} onChange={(event) => updateLetter(index, { paragraphs: event.target.value.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean) })} rows={10} className={inputClass} /></label></div>)}<button type="button" onClick={addLetter} className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:border-[var(--color-accent)]"><Plus className="h-4 w-4" aria-hidden="true" />Add letter</button></div></CollapsibleSection>

      <CollapsibleSection id="question-settings" title="Application Questions"><p className="mb-5 text-sm text-white/65">Each row is one real question. Use the arrows to set its order, choose the answer type, mark it as required, and enter dropdown options one per line. The order below is also the order used in Google Sheets.</p><div className="grid gap-5">{questionGroups.map((group) => <details key={group.type} className="rounded-lg border border-white/10 bg-white/5 p-4"><summary className="flex cursor-pointer list-none items-center justify-between px-2 text-lg font-semibold capitalize [&::-webkit-details-marker]:hidden">{group.type}<ChevronDown className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" /></summary><div className="mt-4 grid gap-4"><input type="hidden" name={`question_${group.type}_count`} value={group.rows.length} />{group.rows.map((row, index) => <QuestionEditor key={`${row.id}-${index}`} type={group.type} index={index} total={group.rows.length} row={row} onChange={(changes) => updateQuestion(group.type, index, changes)} onDelete={() => deleteQuestion(group.type, index)} onMove={(direction) => moveQuestion(group.type, index, direction)} />)}<button type="button" onClick={() => addQuestion(group.type)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:border-[var(--color-accent)]"><Plus className="h-4 w-4" aria-hidden="true" />Add question</button></div></details>)}</div>{sheetHeaders.map((row) => <SheetHeaderPreview key={row.applicationType} applicationType={row.applicationType} text={row.text} />)}</CollapsibleSection>
    </form>
    {isDirty && mounted && createPortal(saveButton, document.body)}
    {isLeaveModalOpen && mounted && createPortal(leaveModal, document.body)}
  </>;
}
