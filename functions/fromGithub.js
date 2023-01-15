import {GITHUB} from "./GITHUB";
import {decodeTimestamp, hashKey256} from "./AES-GCM";

let stateKey;
export async function onRequest(context) {
  const {request, env: {GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, STATE_SECRET}} = context;
  stateKey ??= await hashKey256(STATE_SECRET);
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const payload = await decodeTimestamp(state, stateKey, 100000);

  const responseAccessToken = await GITHUB.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data['access_token']);
  const userData = await responseUserData.json();
  //todo here
  return new Response(JSON.stringify(userData, null, 2));
}