import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";
import { EditorError, env } from "./http";

export const ownerCookie = "inspo-owner";
const sessionSeconds = 60 * 60 * 8;
export interface OwnerIdentity {
  sub: string;
  username: string;
}

export function oidcSettings() {
  return {
    issuer:
      env("AUTHENTIK_ISSUER") ||
      "https://auth.pybash.xyz/application/o/portfolio-inspo/",
    clientId: env("AUTHENTIK_CLIENT_ID") || "portfolio-inspo",
    clientSecret: env("AUTHENTIK_CLIENT_SECRET"),
    ownerSub: env("INSPO_OWNER_SUB"),
    ownerUsername: env("INSPO_OWNER_USERNAME") || "ananjan",
    siteUrl: env("INSPO_SITE_URL") || "https://pybash.xyz",
  };
}

export function ownerConfigured(): boolean {
  const settings = oidcSettings();
  try {
    const issuer = new URL(settings.issuer);
    const site = new URL(settings.siteUrl);
    return (
      !!settings.clientSecret &&
      env("INSPO_SESSION_SECRET").length >= 32 &&
      issuer.protocol === "https:" &&
      !issuer.username &&
      !issuer.password &&
      !issuer.search &&
      !issuer.hash &&
      site.protocol === "https:" &&
      !site.username &&
      !site.password &&
      !site.search &&
      !site.hash &&
      site.pathname === "/"
    );
  } catch {
    return false;
  }
}

export function sign(
  value: string,
  secret = env("INSPO_SESSION_SECRET"),
): string {
  if (secret.length < 32)
    throw new EditorError("Owner access has not been configured yet.", 503);
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function validSignature(value: string, signature: unknown): boolean {
  if (typeof signature !== "string" || env("INSPO_SESSION_SECRET").length < 32)
    return false;
  const expected = Buffer.from(sign(value));
  const supplied = Buffer.from(signature);
  return (
    expected.length === supplied.length && timingSafeEqual(expected, supplied)
  );
}

/** Separate signing purposes prevent a preview or login cookie becoming a session. */
export function sealPayload(purpose: string, payload: unknown): string {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${sign(`${purpose}:${value}`)}`;
}
export function readPayload(
  purpose: string,
  token: string | undefined,
): unknown {
  if (!token || token.length > 3500) return null;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !parts[0] ||
    !validSignature(`${purpose}:${parts[0]}`, parts[1])
  )
    return null;
  try {
    return JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function assertOwner(identity: OwnerIdentity): void {
  const { ownerSub, ownerUsername } = oidcSettings();
  if (
    !identity.sub ||
    (ownerSub ? identity.sub !== ownerSub : identity.username !== ownerUsername)
  ) {
    throw new EditorError(
      "This Authentik account doesn’t have owner access.",
      403,
    );
  }
}

export function createOwnerSession(
  identity: OwnerIdentity,
  now = Date.now(),
): string {
  if (!ownerConfigured())
    throw new EditorError("Owner access has not been configured yet.", 503);
  assertOwner(identity);
  const { issuer, clientId } = oidcSettings();
  return sealPayload("owner-session-v2", {
    ...identity,
    issuer,
    clientId,
    expires: now + sessionSeconds * 1000,
    nonce: randomUUID(),
  });
}

export function checkOwnerSession(
  token: string | undefined,
  now = Date.now(),
): boolean {
  if (!ownerConfigured()) return false;
  const session = readPayload("owner-session-v2", token);
  if (
    typeof session !== "object" ||
    session === null ||
    !("sub" in session) ||
    typeof session.sub !== "string" ||
    !("username" in session) ||
    typeof session.username !== "string" ||
    !("expires" in session) ||
    typeof session.expires !== "number" ||
    !("issuer" in session) ||
    !("clientId" in session)
  )
    return false;
  const settings = oidcSettings();
  if (
    session.issuer !== settings.issuer ||
    session.clientId !== settings.clientId ||
    session.expires <= now ||
    session.expires > now + sessionSeconds * 1000
  )
    return false;
  try {
    assertOwner({ sub: session.sub, username: session.username });
    return true;
  } catch {
    return false;
  }
}

export function requireOwner(cookies: AstroCookies): void {
  if (!checkOwnerSession(cookies.get(ownerCookie)?.value))
    throw new EditorError("Sign in with Authentik to add items.", 401);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/api/inspo",
  maxAge: sessionSeconds,
};
