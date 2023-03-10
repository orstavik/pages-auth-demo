import {GITHUB} from "./AUTH";
import {Base64Token} from "./AES-GCM";

export async function onRequest({env: {STATE_SECRET, GITHUB_REDIRECT, GITHUB_CLIENT_ID}}) {
  //todo into this state code we can add information about the value in the incoming request.
  const state = await Base64Token.encode(STATE_SECRET);
  const href = GITHUB.loginLink(GITHUB_REDIRECT, GITHUB_CLIENT_ID, state);
  return Response.redirect(href);
}