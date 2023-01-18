import {GOOGLE} from "./GOOGLE";
import {decodeBase64Token, encodeBase64Token, hashKey256} from "./AES-GCM";

let stateKey, cookieKey;

export async function onRequest(context) {
  const {request, env: {GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, STATE_SECRET, SESSION_SECRET, SESSION_TTL, STATE_TTL}} = context;
  stateKey ??= await hashKey256(STATE_SECRET);
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  try {
    const emptyBase64Token = await decodeBase64Token(state, stateKey, STATE_TTL);
  } catch (err) {
    return new Response('state error', {status: 500});
  }
//todo: here is a problem
  const res = await GOOGLE.fetchAccessToken(code, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, 'authorization_code');

  let res2 = await res.json();

  console.log("RESPONSE:", res); //expect to be an object with access token and refresh token


  // const cookiePayload = {
  //   user: userData.login + "@google",
  //   rights: "edit,admin", //todo this we need to get from the environment variables
  //   ip: request.headers.get("CF-Connecting-IP")
  // };
  // cookieKey ??= await hashKey256(SESSION_SECRET);
  // const base64cookieToken = await encodeBase64Token(cookieKey, cookiePayload);
  // const response = new Response("hello cookie sunshine: " + base64cookieToken);
  // response.headers.set("Set-Cookie", `id=${base64cookieToken}; Max-Age=${SESSION_TTL / 1000}; secure; httpOnly`);

  const response = new Response("hello cookie sunshine: ")
  return response;
}