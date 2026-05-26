import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "outlook_oauth";
const ALGORITHM = "aes-256-gcm";
const CHUNK_SIZE = 3500;

interface OAuthTokenData {
  accessToken: string;
  email: string;
  name: string;
  expiresAt: number;
}

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32));
}

function encrypt(data: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

function decrypt(payload: string): string {
  const [ivHex, tagHex, encrypted] = payload.split(":");
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 3600,
  };
}

export function buildOAuthCookies(data: OAuthTokenData) {
  const encrypted = encrypt(JSON.stringify(data));
  const chunks: { name: string; value: string }[] = [];

  for (let i = 0; i * CHUNK_SIZE < encrypted.length; i++) {
    chunks.push({
      name: `${COOKIE_PREFIX}_${i}`,
      value: encrypted.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    });
  }

  return { chunks, options: cookieOptions() };
}

export async function getOAuthToken(): Promise<OAuthTokenData | null> {
  const store = await cookies();

  let encrypted = "";
  for (let i = 0; ; i++) {
    const chunk = store.get(`${COOKIE_PREFIX}_${i}`);
    if (!chunk?.value) break;
    encrypted += chunk.value;
  }

  if (!encrypted) return null;

  try {
    const data = JSON.parse(decrypt(encrypted)) as OAuthTokenData;
    if (Date.now() > data.expiresAt * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export async function clearOAuthToken(): Promise<void> {
  const store = await cookies();
  for (let i = 0; ; i++) {
    const name = `${COOKIE_PREFIX}_${i}`;
    if (!store.get(name)) break;
    store.delete(name);
  }
}
