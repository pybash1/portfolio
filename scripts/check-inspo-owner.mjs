import assert from "node:assert/strict";
import {
  assertOwner,
  checkOwnerSession,
  createOwnerSession,
  ownerConfigured,
} from "../src/server/inspo/auth.ts";

Object.assign(process.env, {
  AUTHENTIK_ISSUER: "https://auth.example.com/application/o/inspo/",
  AUTHENTIK_CLIENT_ID: "inspo",
  AUTHENTIK_CLIENT_SECRET: "client-secret",
  INSPO_SESSION_SECRET: "a".repeat(32),
  INSPO_SITE_URL: "https://example.com",
  INSPO_OWNER_USERNAME: "ananjan",
  INSPO_OWNER_SUB: "",
});

const sameUsername = { sub: "another-subject", username: "ananjan" };
assert.equal(ownerConfigured(), false);
assert.throws(() => assertOwner(sameUsername), { status: 403 });
assert.throws(() => createOwnerSession(sameUsername), { status: 503 });

process.env.INSPO_OWNER_SUB = "owner-subject";
assert.equal(ownerConfigured(), true);
assert.throws(() => assertOwner(sameUsername), { status: 403 });

const owner = { sub: "owner-subject", username: "renamed-owner" };
assert.doesNotThrow(() => assertOwner(owner));
const session = createOwnerSession(owner);
assert.equal(checkOwnerSession(session), true);

process.env.INSPO_OWNER_SUB = "";
assert.equal(checkOwnerSession(session), false);
console.log("Inspo owner access requires the configured OIDC subject.");
