import {GOOGLE} from "./GOOGLE";
import {decodeBase64Token, encodeBase64Token, hashKey256} from "./AES-GCM";

let stateKey, cookieKey;

export async function onRequest(context) {
  const {request, env: {GOOGLE_CLIENT_ID, GOOGLE_CODE_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, STATE_SECRET, SESSION_SECRET, SESSION_TTL, STATE_TTL}} = context;
  stateKey ??= await hashKey256(STATE_SECRET);
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  try {
    const emptyBase64Token = await decodeBase64Token(state, stateKey, STATE_TTL);
  } catch (err) {
    return new Response('state error', {status: 500});
  }

  const payload = await GOOGLE.fetchAccessToken(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, 'authorization_code');
  const cookiePayload = {
    user: payload.email,
    rights: "edit,admin", //todo this we need to get from the environment variables
    ip: request.headers.get("CF-Connecting-IP")
  };
  cookieKey ??= await hashKey256(SESSION_SECRET);
  const base64cookieToken = await encodeBase64Token(cookieKey, cookiePayload);
  const response = new Response("hello cookie sunshine: " + payload.email + "_______________" + JSON.stringify(payload))
  response.headers.set("Set-Cookie", `id=${base64cookieToken}; Max-Age=${SESSION_TTL / 1000}; secure; httpOnly`);

  return response;
}