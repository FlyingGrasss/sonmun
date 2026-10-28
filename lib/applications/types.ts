import type { QuestionDefinition } from "@/lib/questions";

export const APPLICATION_TYPES = ["delegate", "chair", "press", "admin", "delegation"] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

export const APPLICATION_STATUSES = ["pending", "accepted", "waitlisted", "denied"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const EMAIL_STATUS_KEYS = ["accepted", "waitlisted", "denied"] as const;
export type EmailStatusKey = (typeof EMAIL_STATUS_KEYS)[number];

export type EmailFilter = "all" | "sent" | "not_sent";

export type ApplicationFilters = {
  type: ApplicationType | "all";
  status: ApplicationStatus | "all";
  emailStatus: EmailFilter;
  q: string;
};

export type ApplicationListItem = {
  id: string;
  applicationType: ApplicationType;
  fullName: string;
  email: string;
  phone: string | null;
  school: string | null;
  status: ApplicationStatus;
  givenCommittee: string | null;
  allocation: string | null;
  appliedAt: string | null;
  lastEmailSentAt: string | null;
  lastEmailStatus: string | null;
  statusEmailSent: boolean;
  createdAt: string;
};

export type ApplicationEmailLogView = {
  id: string;
  templateKey: string | null;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  sentAt: string;
};

export type ApplicationDetail = ApplicationListItem & {
  notes: string | null;
  answers: unknown;
  questions: QuestionDefinition[];
  applicationTitle: string;
  updatedAt: string;
  emailLogs: ApplicationEmailLogView[];
};

export type EmailTemplateView = {
  statusKey: EmailStatusKey;
  subject: string;
  body: string;
  updatedAt: string | null;
  isDefault: boolean;
};

export type ApplicationPatch = {
  status?: ApplicationStatus;
  givenCommittee?: string | null;
  allocation?: string | null;
  notes?: string | null;
};

export type EmailTemplateInput = Record<EmailStatusKey, { subject: string; body: string }>;

export type ActionResult = { ok: true } | { ok: false; error: string };

export type BulkUpdateResult =
  | { ok: true; updated: number; requested: number }
  | { ok: false; error: string };

export type SendMode = "unsent" | "selected";

export type SendOneResult = {
  applicationId: string;
  fullName: string;
  email: string;
  ok: boolean;
  error?: string;
  simulated?: boolean;
  skipped?: boolean;
  warning?: string;
};

export type SendBatchResult = {
  ok: boolean;
  sent: number;
  failed: number;
  simulated: number;
  skipped: number;
  results: SendOneResult[];
  error?: string;
};

export type SyncApplicationTypeResult = {
  ok: boolean;
  type: ApplicationType;
  fetchedRows: number;
  headerMatched: boolean;
  parsed: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  warnings: string[];
  error?: string;
};

export type ApplicationCounts = {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byType: Record<ApplicationType, number>;
};

export type UnsentTarget = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
};
