import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSecretariatAction, updateSecretariatAction } from "@/app/admin/actions";
import ImageUrlField from "@/components/admin/ImageUrlField";
import NameAndSlugFields from "@/components/admin/NameAndSlugFields";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Edit Executive Team Member",
  robots: "noindex",
};

export default async function EditSecretariatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const memberId = Number(id);

  if (!Number.isInteger(memberId)) notFound();

  const member = await prisma.secretariatMember.findUnique({ where: { id: memberId } });
  if (!member) notFound();

  const updateAction = updateSecretariatAction.bind(null, member.id);
  const deleteAction = deleteSecretariatAction.bind(null, member.id);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-white">
      <form action={updateAction} className="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-6">
        <Link href="/admin" className="text-sm text-[var(--color-accent)]">Back to dashboard</Link>
        <h1 className="text-3xl font-bold">Edit Executive Team Member</h1>
        <NameAndSlugFields basePath="/exec" nameValue={member.name} slugValue={member.slug} />
        <input name="role" defaultValue={member.role} placeholder="Role (optional)" className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <input name="sortOrder" type="number" defaultValue={member.sortOrder} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <ImageUrlField name="imageUrl" id="secretariat-image-url" defaultValue={member.imageUrl} required />
        <input name="instagram" defaultValue={member.instagram ?? ""} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <textarea name="bio" rows={10} defaultValue={member.bio} placeholder="Bio (optional)" className="rounded-lg border border-white/15 bg-white/10 px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="isPublished" type="checkbox" defaultChecked={member.isPublished} />
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
