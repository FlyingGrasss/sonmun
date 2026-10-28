import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  EMAIL_STATUS_KEYS,
  type ApplicationStatus,
  type ApplicationType,
  type EmailFilter,
  type EmailStatusKey,
} from "@/lib/applications/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isApplicationType(value: unknown): value is ApplicationType {
  return typeof value === "string" && (APPLICATION_TYPES as readonly string[]).includes(value);
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function isEmailStatusKey(value: unknown): value is EmailStatusKey {
  return typeof value === "string" && (EMAIL_STATUS_KEYS as readonly string[]).includes(value);
}

export function isEmailFilter(value: unknown): value is EmailFilter {
  return value === "all" || value === "sent" || value === "not_sent";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function cleanSingleLine(value: unknown, maxLength = 200) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function cleanMultiLine(value: unknown, maxLength = 10_000) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim().slice(0, maxLength);
}

export function isValidApplicationId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 100 && !/\s/.test(value);
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);
}

export function normalizeIds(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > max) return null;
  const ids = value.filter((item): item is string => typeof item === "string" && isValidApplicationId(item));
  if (ids.length !== value.length) return null;
  return [...new Set(ids)];
}
