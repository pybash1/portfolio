import type { APIRoute } from "astro";
import { requireOwner } from "../../../server/inspo/auth";
import { createItem } from "../../../server/inspo/create";
import {
  editorError,
  json,
  readJson,
  sameOrigin,
} from "../../../server/inspo/http";
import { availableInspoItems } from "../../../server/inspo/availability";

export const prerender = false;
export const GET: APIRoute = async () => {
  try {
    return json({ items: await availableInspoItems() });
  } catch (error) {
    return editorError(error);
  }
};
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    sameOrigin(request);
    requireOwner(cookies);
    await availableInspoItems();
    const item = await createItem(await readJson(request));
    return json({ item }, 201);
  } catch (error) {
    return editorError(error);
  }
};
