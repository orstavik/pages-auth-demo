import {GOOGLE} from "./AUTH";
import {Base64Token} from "./AES-GCM";

export async function onRequest({env: {STATE_TTL, STATE_SECRET, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, GOOGLE_OAUTH_LINK}}) {
  const state = await Base64Token.encode(STATE_SECRET, {ttl: STATE_TTL});
  const href = GOOGLE.loginLink(GOOGLE_OAUTH_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, state);
  return Response.redirect(href);
}