import type { APIRoute } from "astro";
import { editorError, json, sameOrigin } from "../../../../server/inspo/http";
import {
  beginLogin,
  loginCookie,
  loginCookieOptions,
  loginOrigin,
  oidcConfiguration,
} from "../../../../server/inspo/oidc";

export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    sameOrigin(request);
    const origin = loginOrigin(request.url);
    const login = await beginLogin(await oidcConfiguration(), origin);
    cookies.set(loginCookie, login.cookie, {
      ...loginCookieOptions,
      secure: origin.startsWith("https:"),
    });
    return json({ url: login.url });
  } catch (error) {
    return editorError(error);
  }
};
