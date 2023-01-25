import {AUTH, bakeCookie} from "./AUTH";
import {Base64Token} from "./AES-GCM";


export async function onRequest({request, env}) {
  const {
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT,
    GITHUB_CLIENT_SECRET,
    STATE_SECRET,
    SESSION_SECRET,
    SESSION_TTL
  } = env;
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  try {
    const emptyBase64Token = await Base64Token.decode(STATE_SECRET, state);
  } catch (err) {
    return new Response('state error', {status: 500});
  }

  const responseAccessToken = await AUTH.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const data = await responseAccessToken.json();
  const responseUserData = await AUTH.fetchUserData(data.access_token);
  const userData = await responseUserData.json();

  const base64cookieToken = await Base64Token.encode(SESSION_SECRET, {
    user: userData.login + "@github",
    ttl: SESSION_TTL,
    rights: "edit,admin", //todo this we need to get from the environment variables
    ip: request.headers.get("CF-Connecting-IP")
  });
  const response = Response.redirect(new URL("/", request.url));
  response.headers.set("Set-Cookie",
    bakeCookie("id", base64cookieToken, new URL(request.url).hostname, SESSION_TTL));
  return response;
}