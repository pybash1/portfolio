export class EditorError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function env(name: string): string {
  const value = process.env[name] || import.meta.env?.[name];
  return typeof value === "string" ? value : "";
}

export function sameOrigin(request: Request): void {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new EditorError("This request must come from this site.", 403);
  }
}

export async function readJson(
  request: Request,
  limit = 4_300_000,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new EditorError("Send JSON data.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new EditorError("The request is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new EditorError(
        "This item is too large. Choose a file smaller than 3 MB.",
        413,
      );
    }
    chunks.push(part.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new EditorError("The item data could not be read.");
  }
}

export function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function editorError(error: unknown): Response {
  if (error instanceof EditorError)
    return json({ error: error.message }, error.status);
  // Provider errors can contain credentials or internal request details.
  return json(
    { error: "The item couldn’t be saved right now. Please try again." },
    503,
  );
}
