import {GITHUB} from "./GITHUB";
import {encodeBase64Token, hashKey256} from "./AES-GCM";

let stateKey;
export async function onRequest({env: {STATE_SECRET, GITHUB_REDIRECT, GITHUB_CLIENT_ID}}) {
  //todo into this state key we can add information about the value in the incoming request.
  stateKey ??= await hashKey256(STATE_SECRET)
  const state = await encodeBase64Token(stateKey);
  const href = GITHUB.loginLink(GITHUB_REDIRECT, GITHUB_CLIENT_ID, state);
  return Response.redirect(href);
}