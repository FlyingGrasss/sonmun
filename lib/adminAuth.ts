import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONFERENCE } from "@/lib/conference";

const COOKIE_NAME = `${CONFERENCE.id}_admin`;
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.AUTH_SECRET ?? `${CONFERENCE.id}-dev-only-auth-secret`;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function isValidSignature(value: string, signature: string) {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function isValidSession(session: string) {
  const [expires, signature] = session.split(".");
  const expiresAt = Number(expires);

  if (!expires || !signature || Number.isNaN(expiresAt)) return false;
  if (expiresAt <= Date.now()) return false;

  return isValidSignature(expires, signature);
}

export async function setAdminSession() {
  const expires = Date.now() + SESSION_TTL_MS;
  const value = String(expires);
  const session = `${value}.${sign(value)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  cookieStore.set(COOKIE_NAME, "", { path: "/admin", maxAge: 0 });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.getAll(COOKIE_NAME).some(({ value }) => isValidSession(value));
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export function assertAdminPassword(password: string) {
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}
