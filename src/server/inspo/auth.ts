import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";
import * as client from "openid-client";
import { EditorError, env } from "./http";

// Owner session

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
      !!settings.ownerSub &&
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
  const { ownerSub } = oidcSettings();
  if (!ownerSub || identity.sub !== ownerSub) {
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

// Authentik (OIDC) sign-in

export const loginCookie = "inspo-login";
const loginSeconds = 10 * 60;
const callbackPath = "/api/inspo/auth/callback";
export const loginCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/api/inspo/auth",
  maxAge: loginSeconds,
};
interface LoginTransaction {
  state: string;
  nonce: string;
  verifier: string;
  origin: string;
  expires: number;
}

/** Never construct callback destinations from an untrusted Host/forwarded header. */
export function loginOrigin(requestUrl: string): string {
  const origin = new URL(requestUrl).origin;
  if (import.meta.env.DEV && origin === "http://localhost:4321") return origin;
  const expected = new URL(oidcSettings().siteUrl).origin;
  if (origin !== expected)
    throw new EditorError(
      "Sign in from the portfolio’s configured address.",
      400,
    );
  return expected;
}

let cached: { key: string; config: Promise<client.Configuration> } | undefined;
export function oidcConfiguration(): Promise<client.Configuration> {
  if (!ownerConfigured())
    throw new EditorError(
      "Authentik sign-in has not been configured yet.",
      503,
    );
  const { issuer, clientId, clientSecret } = oidcSettings();
  const key = JSON.stringify([issuer, clientId, clientSecret]);
  if (cached?.key === key) return cached.config;
  const config = client.discovery(
    new URL(issuer),
    clientId,
    { client_secret: clientSecret, id_token_signed_response_alg: "RS256" },
    client.ClientSecretPost(clientSecret),
    { timeout: 10, execute: [client.enableNonRepudiationChecks] },
  );
  cached = { key, config };
  void config.catch(() => {
    if (cached?.config === config) cached = undefined;
  });
  return config;
}

export async function beginLogin(
  config: client.Configuration,
  origin: string,
  now = Date.now(),
) {
  const verifier = client.randomPKCECodeVerifier();
  const transaction: LoginTransaction = {
    state: client.randomState(),
    nonce: client.randomNonce(),
    verifier,
    origin,
    expires: now + loginSeconds * 1000,
  };
  const url = client.buildAuthorizationUrl(config, {
    response_type: "code",
    response_mode: "query",
    scope: "openid profile email",
    redirect_uri: `${origin}${callbackPath}`,
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: await client.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
  });
  return { url: url.href, cookie: sealPayload("oidc-login-v1", transaction) };
}

export function readLoginTransaction(
  token: string | undefined,
  origin: string,
  now = Date.now(),
): LoginTransaction {
  const value = readPayload("oidc-login-v1", token);
  if (
    typeof value !== "object" ||
    value === null ||
    !("state" in value) ||
    typeof value.state !== "string" ||
    !("nonce" in value) ||
    typeof value.nonce !== "string" ||
    !("verifier" in value) ||
    typeof value.verifier !== "string" ||
    !("origin" in value) ||
    value.origin !== origin ||
    !("expires" in value) ||
    typeof value.expires !== "number" ||
    value.expires <= now ||
    value.expires > now + loginSeconds * 1000
  ) {
    throw new EditorError("Your sign-in expired. Please try again.", 400);
  }
  return {
    state: value.state,
    nonce: value.nonce,
    verifier: value.verifier,
    origin,
    expires: value.expires,
  };
}

export async function finishLogin(
  config: client.Configuration,
  url: URL,
  transaction: LoginTransaction,
): Promise<OwnerIdentity> {
  if (url.origin !== transaction.origin || url.pathname !== callbackPath)
    throw new EditorError("Invalid sign-in callback.");
  const tokens = await client.authorizationCodeGrant(config, url, {
    pkceCodeVerifier: transaction.verifier,
    expectedState: transaction.state,
    expectedNonce: transaction.nonce,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  if (!claims?.sub)
    throw new EditorError("Authentik did not return an identity.", 401);
  // The library verifies the UserInfo subject matches the signed ID token.
  const profile = await client.fetchUserInfo(
    config,
    tokens.access_token,
    claims.sub,
  );
  const identity = {
    sub: claims.sub,
    username:
      typeof profile.preferred_username === "string"
        ? profile.preferred_username
        : "",
  };
  assertOwner(identity);
  // Access/ID tokens are discarded; only the minimal owner identity enters our session.
  return identity;
}

export function editorRedirect(origin: string, error?: string): Response {
  const url = new URL("/inspo", origin);
  url.searchParams.set("editor", "1");
  if (error) url.searchParams.set("auth_error", error);
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.href,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
