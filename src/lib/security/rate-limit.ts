import crypto from "crypto";
import { TRIAL_LIMITS } from "@/config/plans";

const COOKIE_NAME = "hj_trial_count";
const WINDOW_MS = 24 * 60 * 60 * 1000;

// 同一プロセス内のIP単位レート制限（補助）
const ipBucket = new Map<string, { count: number; resetAt: number }>();

function getSigningSecret(): string {
  return (
    process.env.DATA_ENCRYPTION_KEY ||
    process.env.OPENAI_API_KEY ||
    "fallback-trial-signing-key"
  );
}

function signCount(count: number, expiresAt: number): string {
  const payload = `${count}.${expiresAt}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return `${payload}.${sig}`;
}

function parseSignedCookie(raw: string | undefined): {
  count: number;
  expiresAt: number;
} {
  if (!raw) return { count: 0, expiresAt: Date.now() + WINDOW_MS };
  const parts = raw.split(".");
  if (parts.length !== 3) return { count: 0, expiresAt: Date.now() + WINDOW_MS };

  const count = Number(parts[0]);
  const expiresAt = Number(parts[1]);
  const sig = parts[2];

  if (!Number.isFinite(count) || !Number.isFinite(expiresAt)) {
    return { count: 0, expiresAt: Date.now() + WINDOW_MS };
  }
  if (Date.now() > expiresAt) {
    return { count: 0, expiresAt: Date.now() + WINDOW_MS };
  }

  const expected = signCount(count, expiresAt).split(".")[2];
  if (sig !== expected) {
    return { count: TRIAL_LIMITS.maxAttempts, expiresAt };
  }
  return { count, expiresAt };
}

function getCookieFromRequest(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-nf-client-connection-ip") || "unknown";
}

export function checkTrialRateLimit(request: Request): {
  allowed: boolean;
  used: number;
  remaining: number;
  nextCookieHeader: string;
} {
  const cookieRaw = getCookieFromRequest(request, COOKIE_NAME);
  const parsed = parseSignedCookie(cookieRaw);

  const ip = getClientIp(request);
  const now = Date.now();
  const bucket = ipBucket.get(ip);
  const ipCount =
    bucket && bucket.resetAt > now ? bucket.count : 0;

  const currentUsed = Math.max(parsed.count, ipCount);
  if (currentUsed >= TRIAL_LIMITS.maxAttempts) {
    return {
      allowed: false,
      used: currentUsed,
      remaining: 0,
      nextCookieHeader: "",
    };
  }

  const nextCount = currentUsed + 1;
  const expiresAt =
    parsed.count > 0 ? parsed.expiresAt : now + WINDOW_MS;
  ipBucket.set(ip, { count: nextCount, resetAt: expiresAt });

  const cookieValue = signCount(nextCount, expiresAt);
  const maxAge = Math.max(60, Math.floor((expiresAt - now) / 1000));
  const secureFlag =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  const nextCookieHeader = `${COOKIE_NAME}=${encodeURIComponent(
    cookieValue
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;

  return {
    allowed: true,
    used: nextCount,
    remaining: Math.max(0, TRIAL_LIMITS.maxAttempts - nextCount),
    nextCookieHeader,
  };
}
