import type { InspoItem } from "../../components/inspo/types";
import { EditorError } from "./http";
import { assertInspoBucketAvailable } from "./s3Assets";
import { itemStore } from "./store";

/** Return only public collection data, and never include provider errors in responses. */
export async function availableInspoItems(
  readItems: () => Promise<InspoItem[]> = () => itemStore().read(),
  checkBucket: () => Promise<void> = assertInspoBucketAvailable,
): Promise<InspoItem[]> {
  try {
    const [items] = await Promise.all([readItems(), checkBucket()]);
    return items;
  } catch {
    throw new EditorError("Homelab is down", 503);
  }
}
