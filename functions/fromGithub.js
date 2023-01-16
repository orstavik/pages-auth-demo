import {GITHUB} from "./GITHUB";
import {decodeBase64Token, encodeBase64Token, hashKey256} from "./AES-GCM";

let stateKey, cookieKey;

export async function onRequest(context) {
  const {request, env: {GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, STATE_SECRET, SESSION_SECRET, SESSION_TTL, STATE_TTL}} = context;
  stateKey ??= await hashKey256(STATE_SECRET);
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  try {
    const emptyBase64Token = await decodeBase64Token(state, stateKey, STATE_TTL);
  } catch (err) {
    return new Response('state error', {status: 500});
  }

  const responseAccessToken = await GITHUB.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data['access_token']);
  const userData = await responseUserData.json();

  const cookiePayload = {
    user: userData.login + "@github",
    ttl: STATE_TTL,
    rights: "edit,admin", //todo this we need to get from the environment variables
    ip: request.headers.get("CF-Connecting-IP")
  };
  cookieKey ??= await hashKey256(SESSION_SECRET);
  const base64cookieToken = await encodeBase64Token(cookieKey, cookiePayload);
  const response = new Response("hello cookie sunshine: " + base64cookieToken);
  response.headers.set("Set-Cookie", `id=${base64cookieToken}; Max-Age=${SESSION_TTL / 1000}; secure; httpOnly`);
  return response;
}