import {AUTH} from "./AUTH";
import {encodeBase64Token} from "./AES-GCM";

export async function onRequest({env: {STATE_SECRET, GITHUB_REDIRECT, GITHUB_CLIENT_ID}}) {
  //todo into this state code we can add information about the value in the incoming request.
  const state = await encodeBase64Token(STATE_SECRET);
  const href = AUTH.loginLink(GITHUB_REDIRECT, GITHUB_CLIENT_ID, state);
  return Response.redirect(href);
}