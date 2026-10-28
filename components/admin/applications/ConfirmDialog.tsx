"use client";

import { useRef } from "react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      pending={pending}
      initialFocusRef={cancelRef}
      footer={
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
              destructive
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-[var(--color-accent)] text-[var(--background)] hover:bg-white"
            }`}
          >
            {pending ? "Working..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-white/75">{description}</p>
    </Modal>
  );
}
