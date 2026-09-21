// Uses Web Crypto (globalThis.crypto.subtle) rather than Node's `crypto`
// module so the same code runs in both the Node runtime (API routes) and
// the Edge runtime (middleware).

export const ADMIN_SESSION_COOKIE = "hop_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufferToHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

export function checkAdminPassword(candidate: string): boolean {
  return timingSafeEqual(candidate, requireAdminPassword());
}

/** Stateless session token: `${expiry}.${hmac}`, signed with the admin password. */
export async function createAdminSessionToken(): Promise<{
  token: string;
  maxAgeSeconds: number;
}> {
  const expiry = Date.now() + SESSION_TTL_MS;
  const sig = await hmacHex(`admin:${expiry}`, requireAdminPassword());
  return { token: `${expiry}.${sig}`, maxAgeSeconds: SESSION_TTL_MS / 1000 };
}

export async function isValidAdminSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const [expiryStr, sig] = token.split(".");
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || !sig || Date.now() > expiry) return false;
  const expectedSig = await hmacHex(`admin:${expiry}`, requireAdminPassword());
  return timingSafeEqual(sig, expectedSig);
}
