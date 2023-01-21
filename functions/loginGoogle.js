import {GOOGLE} from "./GOOGLE";
import {encodeBase64Token, hashKey256} from "./AES-GCM";

let stateKey;
export async function onRequest({env: {SECRET, STATE_PARAM_TTL, STATE_SECRET, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, GOOGLE_OAUTH_LINK, GOOGLE_CODE_LINK}}) {
  //todo into this state key we can add information about the value in the incoming request.
  console.log("redirect")
  stateKey ??= await hashKey256(STATE_SECRET)
  const state = await encodeBase64Token(stateKey);
  const href = GOOGLE.loginLink(GOOGLE_CODE_LINK, GOOGLE_OAUTH_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, state);
  return Response.redirect(href);
}