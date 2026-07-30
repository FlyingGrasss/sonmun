import Link from "next/link";
import { logoutAction, createCommitteeAction, createSecretariatAction, saveConferenceSettingsAction } from "@/app/admin/actions";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import ImageUrlField from "@/components/admin/ImageUrlField";
import NameAndSlugFields from "@/components/admin/NameAndSlugFields";
import { CONFERENCE } from "@/lib/conference";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";

export const metadata = {
  title: `Admin | ${CONFERENCE.shortName}`,
  robots: "noindex",
};

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  required = false,
  rows = 6,
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white">
      {label}
      <textarea
        name={name}
        rows={rows}
        required={required}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const [committees, secretariat, settings] = await Promise.all([
    prisma.committee.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.secretariatMember.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    getSiteSettings(),
  ]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {CONFERENCE.shortName}
            </p>
            <h1 className="text-4xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <form action={logoutAction}>
              <button className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-[var(--color-accent)]">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/25 p-6">
            <h2 className="mb-4 text-2xl font-bold">Committees</h2>
            <div className="space-y-3">
              {committees.map((committee) => (
                <div key={committee.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-semibold">{committee.name}</p>
                    <p className="text-sm text-gray-300">{committee.isPublished ? "Published" : "Draft"}</p>
                  </div>
                  <Link className="text-sm font-semibold text-[var(--color-accent)]" href={`/admin/committees/${committee.id}`}>
                    Edit
                  </Link>
                </div>
              ))}
              {committees.length === 0 && <p className="text-sm text-gray-300">No committees yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-6">
            <h2 className="mb-4 text-2xl font-bold">Executive Team</h2>
            <div className="space-y-3">
              {secretariat.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    {member.role && <p className="text-sm text-gray-300">{member.role}</p>}
                  </div>
                  <Link className="text-sm font-semibold text-[var(--color-accent)]" href={`/admin/secretariat/${member.id}`}>
                    Edit
                  </Link>
                </div>
              ))}
              {secretariat.length === 0 && <p className="text-sm text-gray-300">No Executive Team members yet.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form action={createCommitteeAction} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-6">
            <h2 className="text-2xl font-bold">New Committee</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <NameAndSlugFields basePath="/committees" />
              <Field label="Sort Order" name="sortOrder" type="number" />
              <ImageUrlField name="imageUrl" id="committee-image-url" required />
            </div>
            <Textarea label="Description" name="description" required />
            <Textarea label="Documents, one per line: Title | URL" name="documents" rows={3} />
            <label className="flex items-center gap-2 text-sm text-white">
              <input name="isPublished" type="checkbox" defaultChecked />
              Published
            </label>
            <button className="rounded-lg bg-[var(--color-accent)] px-4 py-3 font-bold text-[var(--background)] hover:bg-white">
              Create Committee
            </button>
          </form>

          <form action={createSecretariatAction} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-6">
            <h2 className="text-2xl font-bold">New Executive Team Member</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <NameAndSlugFields basePath="/secretariat" />
              <Field label="Role (optional)" name="role" />
              <Field label="Sort Order" name="sortOrder" type="number" />
              <ImageUrlField name="imageUrl" id="secretariat-image-url" required />
              <Field label="Instagram URL" name="instagram" />
            </div>
            <Textarea label="Bio (optional)" name="bio" />
            <label className="flex items-center gap-2 text-sm text-white">
              <input name="isPublished" type="checkbox" defaultChecked />
              Published
            </label>
            <button className="rounded-lg bg-[var(--color-accent)] px-4 py-3 font-bold text-[var(--background)] hover:bg-white">
              Create Member
            </button>
          </form>
        </section>

        <section id="conference-settings" className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold">Site Settings</h2>
            <p className="mt-2 text-sm text-white/65">Conference content, applications, letters, visibility, and form rules are managed here alongside committees and the Executive Team.</p>
          </div>
          <AdminSettingsForm settings={settings} action={saveConferenceSettingsAction} />
        </section>
      </div>
    </main>
  );
}
