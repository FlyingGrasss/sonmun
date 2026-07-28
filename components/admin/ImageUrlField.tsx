"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Check, Upload } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const inputClass = "rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-[var(--color-accent)]";

export default function ImageUrlField({ name, id = name, defaultValue = "", required = false }: { name: string; id?: string; defaultValue?: string; required?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async () => {
    const file = fileInputRef.current?.files?.[0];
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-white sm:col-span-2">
      <label htmlFor={id}>Image URL</label>
      <input id={id} name={name} value={url} onChange={(event) => setUrl(event.target.value)} required={required} className={inputClass} />
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="max-w-full text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />
        <button type="button" onClick={uploadFile} disabled={isUploading} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isUploading ? "Uploading" : "Upload image"}
        </button>
        {status && <span className="inline-flex items-center gap-1 text-xs text-white/65"><Check className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />{status}</span>}
      </div>
      <span className="text-xs text-white/50">PNG, JPG, WebP, or GIF up to 10 MB.</span>
    </div>
  );
}
