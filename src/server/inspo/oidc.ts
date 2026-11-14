import * as client from "openid-client";
import {
  assertOwner,
  oidcSettings,
  ownerConfigured,
  readPayload,
  sealPayload,
  type OwnerIdentity,
} from "./auth";
import { EditorError } from "./http";

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
