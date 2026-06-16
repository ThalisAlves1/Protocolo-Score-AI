import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "psai_admin_session";
const ADMIN_SESSION_HOURS = 8;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function getAdminSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "protocolo-score-ai-dev-secret"
  );
}

export function getAdminCookieMaxAge() {
  return ADMIN_SESSION_HOURS * 60 * 60;
}

export function createAdminToken() {
  return createHmac("sha256", getAdminSecret())
    .update(getAdminPassword())
    .digest("hex");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isValidAdminPassword(password: string) {
  return safeCompare(password, getAdminPassword());
}

export function isValidAdminToken(token?: string | null) {
  if (!token) return false;
  return safeCompare(token, createAdminToken());
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminToken(token);
}

export function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.split("=")[1];

  return isValidAdminToken(token);
}
