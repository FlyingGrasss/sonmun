import type { Metadata } from "next";
import KvkkApplicationForm from "@/components/kvkk/KvkkApplicationForm";

export const metadata: Metadata = {
  title: "KVKK Başvuru Formu",
  description: "Use this form to submit a request under the Turkish Personal Data Protection Law.",
  alternates: { canonical: "/kvkk" },
};

export default function KvkkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 text-white sm:px-10 lg:py-24">
      <article className="rounded-3xl border border-white/15 bg-black/20 p-6 shadow-2xl sm:p-10">
        <header className="border-b border-white/15 pb-7">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Personal Data</p>
          <h1 className="text-4xl font-bold text-[var(--color-accent)] sm:text-5xl">KVKK Başvuru Formu</h1>
        </header>

        <div className="mt-8 space-y-4 text-base leading-7 text-white/80">
          <p>Use this form to exercise your rights under the Turkish Personal Data Protection Law (KVKK).</p>
          <p>Questions about the form can be sent to <a href="mailto:son.modelunitednations26@gmail.com" className="font-semibold text-[var(--color-accent)] underline underline-offset-2 hover:text-white">son.modelunitednations26@gmail.com</a>.</p>
        </div>

        <KvkkApplicationForm />
      </article>
    </main>
  );
}
