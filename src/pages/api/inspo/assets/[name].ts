import type { APIRoute } from "astro";
import {
  readInspoAsset,
  validAssetName,
} from "../../../../server/inspo/s3Assets";

export const prerender = false;
export const GET: APIRoute = async ({ params }) => {
  const name = params.name ?? "";
  if (!validAssetName(name)) return new Response(null, { status: 404 });
  try {
    const bytes = await readInspoAsset(name);
    if (!bytes) return new Response(null, { status: 404 });
    const extension = name.split(".").pop();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          extension === "webp" ? "image/webp" : `font/${extension}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 503
    )
      return new Response(null, { status: 503 });
    return new Response(null, { status: 502 });
  }
};
