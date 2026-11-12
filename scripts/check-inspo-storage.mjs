import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mock } from "bun:test";
import sharp from "sharp";

const deleted = [];
let failDelete = false;
mock.module(
  new URL("../src/server/inspo/s3Assets.ts", import.meta.url).pathname,
  () => ({
    inspoAssetKey: (src) =>
      src.startsWith("/api/inspo/assets/") ? src.slice(1) : null,
    deleteInspoAsset: async (key) => {
      deleted.push(key);
      if (failDelete) throw new Error("Storage unavailable");
    },
    uploadInspoAsset: async () => "/api/inspo/assets/uploaded.webp",
  }),
);

const { createItem } = await import("../src/server/inspo/create.ts");
const { createPostgresStore } =
  await import("../src/server/inspo/postgresStore.ts");
const { availableInspoItems } =
  await import("../src/server/inspo/availability.ts");

const image = await sharp({
  create: { width: 2, height: 2, channels: 3, background: "white" },
})
  .png()
  .toBuffer();
const input = () => ({
  requestId: randomUUID(),
  fields: {
    kind: "image",
    title: "Sample",
    url: "",
    fileData: image.toString("base64"),
  },
});
const uploaded = "/api/inspo/assets/uploaded.webp";

const failedStore = {
  read: async () => [],
  asset: async () => uploaded,
  add: async () => {
    throw new Error("Database unavailable");
  },
  discardAsset: async (src) => deleted.push(src),
};
await assert.rejects(createItem(input(), failedStore), /Database unavailable/);
assert.deepEqual(deleted, [uploaded]);

deleted.length = 0;
const duplicateStore = {
  ...failedStore,
  add: async (item) => ({ ...item, image: { ...item.image, src: "existing" } }),
};
await createItem(input(), duplicateStore);
assert.deepEqual(deleted, [uploaded]);

deleted.length = 0;
const savedStore = { ...failedStore, add: async (item) => ({ ...item }) };
await createItem(input(), savedStore);
assert.deepEqual(deleted, []);

const textItem = await createItem(
  { requestId: randomUUID(), fields: { kind: "text", text: "Still here" } },
  {
    ...savedStore,
    asset: async () => {
      throw new Error("Media storage unavailable");
    },
  },
);
assert.equal(textItem.text, "Still here");
assert.deepEqual(await availableInspoItems(async () => [textItem]), [textItem]);
await assert.rejects(
  availableInspoItems(async () => {
    throw new Error("Database unavailable");
  }),
  (error) => error.status === 503 && error.message === "Homelab is down",
);

const hashes = [];
const addDb = {
  insert: () => ({
    values: (values) => {
      hashes.push(values.sourceHash);
      return {
        onConflictDoNothing: () => ({
          returning: async () => [{ item: values.item }],
        }),
      };
    },
  }),
};
const addStore = createPostgresStore(addDb);
const base = { id: "a", title: "Sample", position: { x: 0, y: 0, width: 420 } };
await addStore.add({
  ...base,
  kind: "tweet",
  url: "https://x.com/u/status/123",
});
await addStore.add({
  ...base,
  kind: "website",
  source: { url: "https://x.com/u/status/123", label: "x.com" },
});
assert.equal(hashes[0], hashes[1]);
assert.match(hashes[0], /^[a-f0-9]{64}$/);

let rowDeleted = false;
let selects = 0;
const removeDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () =>
          ++selects % 2 === 1
            ? [{ item: { ...base, kind: "image", image: { src: uploaded } } }]
            : [],
      }),
    }),
  }),
  delete: () => ({
    where: async () => {
      rowDeleted = true;
    },
  }),
};
const removeStore = createPostgresStore(removeDb);
failDelete = true;
await assert.rejects(removeStore.remove("a"), /Media couldn’t be deleted/);
assert.equal(rowDeleted, false);
failDelete = false;
await removeStore.remove("a");
assert.equal(rowDeleted, true);

console.log(
  "Inspiration availability, media cleanup, and URL uniqueness passed.",
);
