import assert from "node:assert/strict";
import { mock } from "bun:test";

process.env.INSPO_SESSION_SECRET = "a".repeat(32);

mock.module(
  new URL("../src/server/inspo/publicFetch.ts", import.meta.url).pathname,
  () => ({
    publicTarget: async (value) => ({ url: new URL(value) }),
    fetchPublicPage: async () => {
      throw new Error("Upstream returned 403");
    },
  }),
);

const { makeUrlPreview, verifyUrlPreview } =
  await import("../src/server/inspo/preview.ts");
const preview = await makeUrlPreview("https://example.com/article");

assert.equal(preview.draft.kind, "website");
assert.equal(preview.draft.title, "example.com");
assert.match(preview.warning ?? "", /title couldn.t be fetched/i);
assert.deepEqual(verifyUrlPreview(preview, preview.draft.url), preview.draft);
console.log("Blocked website titles still produce an editable preview.");
