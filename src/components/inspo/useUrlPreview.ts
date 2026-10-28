import { useEffect, useState } from "react";
import {
  editorRequest,
  normalizeItemUrl,
  type UrlPreview,
} from "../../lib/inspoEditor";

/** Debounce edits and discard responses for URLs the owner has moved past. */
export function useUrlPreview(url: string, enabled: boolean) {
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPreview(null);
    setError("");
    setLoading(false);
    if (!enabled || !url.trim()) return;
    try {
      normalizeItemUrl(url);
    } catch {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      editorRequest<UrlPreview>("preview", {
        method: "POST",
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })
        .then((result) => {
          if (!controller.signal.aborted) setPreview(result);
        })
        .catch((reason: unknown) => {
          if (!controller.signal.aborted)
            setError(
              reason instanceof Error
                ? reason.message
                : "The preview couldn’t be fetched.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, enabled, attempt]);

  // A render can precede the effect that clears the previous URL's response.
  let current = false;
  try {
    current = !!preview && preview.draft.url === normalizeItemUrl(url).href;
  } catch {}
  return {
    preview: current ? preview : null,
    error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  };
}
