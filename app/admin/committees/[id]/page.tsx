import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCommitteeAction, updateCommitteeAction } from "@/app/admin/actions";
import { stringifyDocuments } from "@/lib/documents";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Edit Committee",
  robots: "noindex",
};

export default async function EditCommitteePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const committeeId = Number(id);

  if (!Number.isInteger(committeeId)) notFound();

  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) notFound();

  const updateAction = updateCommitteeAction.bind(null, committee.id);
  const deleteAction = deleteCommitteeAction.bind(null, committee.id);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-white">
      <form action={updateAction} className="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-6">
        <Link href="/admin" className="text-sm text-[var(--color-accent)]">Back to dashboard</Link>
        <h1 className="text-3xl font-bold">Edit Committee</h1>
        <input name="name" defaultValue={committee.name} required className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <input name="slug" defaultValue={committee.slug} required className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <input name="sortOrder" type="number" defaultValue={committee.sortOrder} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <input name="imageUrl" defaultValue={committee.imageUrl} required className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <textarea name="description" rows={10} defaultValue={committee.description} required className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <textarea name="documents" rows={4} defaultValue={stringifyDocuments(committee.documents)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="isPublished" type="checkbox" defaultChecked={committee.isPublished} />
          Published
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-[var(--color-accent)] px-4 py-3 font-bold text-[var(--background)] hover:bg-white">Save</button>
          <button formAction={deleteAction} className="rounded-lg border border-red-400/50 px-4 py-3 font-bold text-red-100 hover:bg-red-500/20">Delete</button>
        </div>
      </form>
    </main>
  );
}
