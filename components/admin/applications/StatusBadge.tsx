import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ApplicationStatus } from "@/lib/applications/types";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    Icon: Clock,
  },
  accepted: {
    label: "Accepted",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    Icon: CheckCircle2,
  },
  waitlisted: {
    label: "Waitlisted",
    className: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    Icon: AlertCircle,
  },
  denied: {
    label: "Denied",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    Icon: XCircle,
  },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <config.Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
