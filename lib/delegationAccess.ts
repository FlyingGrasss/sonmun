import { timingSafeEqual } from "node:crypto";

export function getDelegationAccessToken() {
  return process.env.DELEGATION_ACCESS_TOKEN?.trim() || null;
}

export function isValidDelegationAccessToken(token: string | null | undefined) {
  if (!token) return false;

  const expected = getDelegationAccessToken();
  if (!expected) return false;

  const providedBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function canAccessDelegationApplication(
  applicationType: string,
  token: string | null | undefined
) {
  return applicationType === "delegation" && isValidDelegationAccessToken(token);
}
