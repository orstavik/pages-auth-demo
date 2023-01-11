import {GITHUB} from "./GITHUB";

export async function onRequest(context) {
  const {request, env: {GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET}} = context;
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  // if(states.indexOf(state) === -1) //todo verify the state parameter using env.STATESECRET
  //   return new Response('state is lost');
  const responseAccessToken = await GITHUB.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data['access_token']);
  const userData = await responseUserData.json();

  return new Response(JSON.stringify(userData, null, 2));
}