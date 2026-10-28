import type { APIRoute } from "astro";
import { requireOwner } from "../../../server/inspo/auth";
import {
  EditorError,
  editorError,
  json,
  readJson,
  sameOrigin,
} from "../../../server/inspo/http";
import { makeUrlPreview } from "../../../server/inspo/preview";
import { itemUrlKey } from "../../../lib/inspoEditor";
import { itemStore } from "../../../server/inspo/store";

export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    sameOrigin(request);
    requireOwner(cookies);
    const body = (await readJson(request, 4096)) as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048)
      throw new EditorError("Enter a valid website URL.");
    let key: string;
    try {
      key = itemUrlKey(body.url);
    } catch {
      throw new EditorError("Enter a valid website URL.");
    }
    const items = await itemStore().read();
    if (
      items.some((item) => item.source && itemUrlKey(item.source.url) === key)
    )
      throw new EditorError("That URL is already on the board.", 409);
    return json(await makeUrlPreview(body.url));
  } catch (error) {
    return editorError(error);
  }
};
