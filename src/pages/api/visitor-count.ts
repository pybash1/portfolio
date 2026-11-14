import type { APIRoute } from "astro";
import { EditorError, json, sameOrigin } from "../../server/inspo/http";

export const prerender = false;

const counterKey = "pybash-xyz-visitors-71e2ada51b";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    sameOrigin(request);
    const seen = cookies.get("portfolio-visitor")?.value === "1";
    const action = seen ? "get" : "hit";
    const response = await fetch(
      `https://countapi.mileshilliard.com/api/v1/${action}/${counterKey}`,
      { signal: AbortSignal.timeout(4_000), cache: "no-store" },
    );
    if (!response.ok) throw new Error("Counter unavailable");

    const result: unknown = await response.json();
    const count = (result as { value?: unknown }).value;
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0)
      throw new Error("Invalid counter response");

    if (!seen) {
      cookies.set("portfolio-visitor", "1", {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
    }

    return json({ count });
  } catch (error) {
    if (error instanceof EditorError)
      return json({ error: error.message }, error.status);
    return json({ error: "Visitor count unavailable." }, 503);
  }
};
