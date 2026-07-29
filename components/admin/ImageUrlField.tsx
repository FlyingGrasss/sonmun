"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Check, ImagePlus } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImageUrlField({ name, id = name, defaultValue = "", required = false }: { name: string; id?: string; defaultValue?: string; required?: boolean }) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File | undefined) => {
    if (!file) {
      setStatus("Choose an image first.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("Images must be 10 MB or smaller.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading...");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await upload(`admin/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/admin/upload",
        contentType: file.type,
      });
      setUrl(blob.url);
      setStatus("Image uploaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-white sm:col-span-2">
      <label htmlFor={id}>Image</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[var(--color-accent)] has-[:disabled]:cursor-wait has-[:disabled]:opacity-50">
          <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void uploadFile(event.target.files?.[0])} disabled={isUploading} required={required && !url} className="sr-only" />
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {isUploading ? "Uploading" : "Choose image"}
        </label>
        {url && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Uploaded image preview" className="h-20 w-28 rounded-md object-cover" />
            <span className="text-xs text-white/70">Image ready</span>
          </div>
        )}
        {status && <span className="inline-flex items-center gap-1 text-xs text-white/65"><Check className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />{status}</span>}
        {!url && !status && <span className="text-xs text-white/50">No image uploaded yet.</span>}
      </div>
      <span className="text-xs text-white/50">PNG, JPG, WebP, or GIF up to 10 MB.</span>
    </div>
  );
}
