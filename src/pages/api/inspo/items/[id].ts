import type { APIRoute } from "astro";
import { requireOwner } from "../../../../server/inspo/auth";
import {
  EditorError,
  editorError,
  json,
  sameOrigin,
} from "../../../../server/inspo/http";
import { itemStore } from "../../../../server/inspo/store";

export const prerender = false;
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    sameOrigin(request);
    requireOwner(cookies);
    const id = params.id ?? "";
    if (!id || id.length > 200) throw new EditorError("Choose an item.");
    // Deleting an item that is already gone is a success, so retries are safe.
    await itemStore().remove(id);
    return json({ id });
  } catch (error) {
    return editorError(error);
  }
};
