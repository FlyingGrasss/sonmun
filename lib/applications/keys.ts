import { createHash } from "node:crypto";
import type { ApplicationType } from "@/lib/applications/types";

export function normalizeKeyPart(value: string) {
  return value
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function shortHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function applicationSourceKey(
  type: ApplicationType,
  input: { email: string; school?: string | null }
) {
  const email = normalizeKeyPart(input.email) || "no-email";
  if (type !== "delegation") return `${type}:${email}`;
  const school = normalizeKeyPart(input.school ?? "");
  return `delegation:${email}:${shortHash(school || "no-school")}`;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, entry]) => [key, stableValue(entry)])
    );
  }
  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export function applicationContentHash(input: {
  fullName: string;
  email: string;
  phone: string | null;
  school: string | null;
  answers: unknown;
}) {
  return shortHash(
    stableJson({
      fullName: input.fullName,
      email: normalizeKeyPart(input.email),
      phone: input.phone ?? "",
      school: input.school ?? "",
      answers: input.answers ?? null,
    })
  );
}

export function dedupeApplicationKeys<T extends { sourceKey: string; sourceHash: string; email: string }>(
  items: T[]
): { items: T[]; warnings: string[] } {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(item.sourceKey) ?? [];
    group.push(item);
    groups.set(item.sourceKey, group);
  }

  const result: T[] = [];
  const warnings: string[] = [];

  for (const [baseKey, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const seenHashes = new Set<string>();
    let occurrence = 0;
    for (const item of group) {
      if (seenHashes.has(item.sourceHash)) {
        warnings.push(`Duplicate application collapsed: ${item.email || baseKey}.`);
        continue;
      }
      seenHashes.add(item.sourceHash);
      occurrence += 1;
      result.push(occurrence === 1 ? item : { ...item, sourceKey: `${baseKey}#${occurrence}` });
    }
    warnings.push(`Multiple applications share the key "${baseKey}"; stable suffixes were added.`);
  }

  return { items: result, warnings };
}
