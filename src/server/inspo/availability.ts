import type { InspoItem } from "../../components/inspo/types";
import { EditorError } from "./http";
import { itemStore } from "./store";

/** Return only public collection data, and never include provider errors in responses. */
export async function availableInspoItems(
  readItems: () => Promise<InspoItem[]> = () => itemStore().read(),
): Promise<InspoItem[]> {
  try {
    return await readItems();
  } catch {
    throw new EditorError("Homelab is down", 503);
  }
}
