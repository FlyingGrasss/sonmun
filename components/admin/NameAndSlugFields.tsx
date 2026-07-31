"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";

export default function NameAndSlugFields({
  basePath,
  nameValue = "",
  slugValue = "",
}: {
  basePath: "/committees" | "/exec";
  nameValue?: string;
  slugValue?: string;
}) {
  const [name, setName] = useState(nameValue);
  const [slug, setSlug] = useState(slugValue);
  const previewSlug = slug.trim() || slugify(name) || "your-slug";

  return (
    <>
      <label className="flex flex-col gap-2 text-sm text-white">
        Name
        <input name="name" value={name} onChange={(event) => setName(event.target.value)} required className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white">
        Link
        <input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]" />
        <span className="text-xs text-white/60">This becomes the last part of the page link. Leave it blank to generate it from the name.</span>
        <span className="text-xs text-[var(--color-accent)]">Page URL: {basePath}/{previewSlug}</span>
      </label>
    </>
  );
}
