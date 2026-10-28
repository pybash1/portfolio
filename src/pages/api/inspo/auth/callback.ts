import type { APIRoute } from "astro";
import {
  cookieOptions,
  createOwnerSession,
  ownerCookie,
} from "../../../../server/inspo/auth";
import { EditorError, editorError } from "../../../../server/inspo/http";
import {
  editorRedirect,
  finishLogin,
  loginCookie,
  loginCookieOptions,
  loginOrigin,
  oidcConfiguration,
  readLoginTransaction,
} from "../../../../server/inspo/oidc";

export const prerender = false;
export const GET: APIRoute = async ({ request, cookies }) => {
  let origin: string;
  try {
    origin = loginOrigin(request.url);
  } catch (error) {
    return editorError(error);
  }
  try {
    const url = new URL(request.url);
    const transaction = readLoginTransaction(
      cookies.get(loginCookie)?.value,
      origin,
    );
    // Validate before consuming the cookie or contacting the token endpoint.
    if (
      url.searchParams.getAll("state").length !== 1 ||
      url.searchParams.get("state") !== transaction.state
    )
      throw new EditorError("Invalid sign-in state.");
    cookies.delete(loginCookie, { path: loginCookieOptions.path });
    if (url.searchParams.get("error") === "access_denied")
      return editorRedirect(origin, "cancelled");
    const identity = await finishLogin(
      await oidcConfiguration(),
      url,
      transaction,
    );
    cookies.set(ownerCookie, createOwnerSession(identity), {
      ...cookieOptions,
      secure: origin.startsWith("https:"),
    });
    return editorRedirect(origin);
  } catch (error) {
    const reason =
      error instanceof EditorError && error.status === 403
        ? "forbidden"
        : "failed";
    return editorRedirect(origin, reason);
  }
};
