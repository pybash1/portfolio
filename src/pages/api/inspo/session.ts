import type { APIRoute } from "astro";
import {
  checkOwnerSession,
  cookieOptions,
  ownerConfigured,
  ownerCookie,
} from "../../../server/inspo/auth";
import { editorError, json, sameOrigin } from "../../../server/inspo/http";
import { loginCookie, loginCookieOptions } from "../../../server/inspo/oidc";
import { storageConfigured } from "../../../server/inspo/store";

export const prerender = false;
export const GET: APIRoute = ({ cookies }) =>
  json({
    authenticated: checkOwnerSession(cookies.get(ownerCookie)?.value),
    configured: ownerConfigured(),
    storageConfigured: storageConfigured(),
  });
export const DELETE: APIRoute = ({ request, cookies }) => {
  try {
    sameOrigin(request);
    cookies.delete(ownerCookie, { path: cookieOptions.path });
    cookies.delete(loginCookie, { path: loginCookieOptions.path });
    return json({ authenticated: false });
  } catch (error) {
    return editorError(error);
  }
};
