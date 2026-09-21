"use client";

import { useState } from "react";

type FormState = {
  fullName: string;
  identityNumber: string;
  email: string;
  phone: string;
  requestDetails: string;
  applicationDate: string;
};

const initialForm: FormState = {
  fullName: "",
  identityNumber: "",
  email: "",
  phone: "",
  requestDetails: "",
  applicationDate: "",
};

const inputClass = "mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]";

export default function KvkkApplicationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState({ message: "", error: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: "", error: false });

    try {
      const response = await fetch("/api/kvkk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setStatus({ message: result.message ?? "We could not submit your request.", error: true });
        return;
      }
      setForm(initialForm);
      setStatus({ message: result.message ?? "Your request has been received.", error: false });
    } catch {
      setStatus({ message: "We could not submit your request. Please try again.", error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-10 space-y-8" onSubmit={submit} aria-label="KVKK application form">
      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-1 text-xl font-semibold text-[var(--color-accent)]">Applicant details</legend>
        <div>
          <label htmlFor="fullName" className="text-sm font-semibold">Full name *</label>
          <input id="fullName" name="fullName" type="text" required maxLength={200} value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="identityNumber" className="text-sm font-semibold">T.C. identity number / passport number *</label>
          <input id="identityNumber" name="identityNumber" type="text" required maxLength={50} value={form.identityNumber} onChange={(event) => updateField("identityNumber", event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email *</label>
          <input id="email" name="email" type="email" required maxLength={320} value={form.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-semibold">Phone</label>
          <input id="phone" name="phone" type="tel" maxLength={50} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="requestDetails" className="text-sm font-semibold">Request and details *</label>
        <textarea id="requestDetails" name="requestDetails" required minLength={10} maxLength={10000} rows={8} value={form.requestDetails} onChange={(event) => updateField("requestDetails", event.target.value)} className={`${inputClass} resize-y`} placeholder="Describe your request and include any details needed to process it." />
      </div>

      <div className="max-w-xs">
        <label htmlFor="applicationDate" className="text-sm font-semibold">Application date *</label>
        <input id="applicationDate" name="applicationDate" type="date" required value={form.applicationDate} onChange={(event) => updateField("applicationDate", event.target.value)} className={inputClass} />
      </div>

      {status.message && (
        <p role="status" aria-live="polite" className={`rounded-lg px-4 py-3 ${status.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {status.message}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={`rounded-xl bg-[var(--color-accent)] px-6 py-3 font-bold text-[var(--background)] transition hover:bg-white ${isSubmitting ? "cursor-not-allowed opacity-60" : ""}`}>
        {isSubmitting ? "Submitting..." : "Submit KVKK Request"}
      </button>
    </form>
  );
}
