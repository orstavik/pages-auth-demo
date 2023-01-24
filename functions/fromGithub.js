import {GITHUB} from "./GITHUB";
import {decodeBase64Token, encodeBase64Token} from "./AES-GCM";

function bakeCookie(name, value, domain, ttl) {
  return `${name}=${value}; Domain=${domain}; SameSite=LAX; Max-Age=${ttl}; path=/; secure; httpOnly`;
}

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
    const emptyBase64Token = await decodeBase64Token(STATE_SECRET, state);
  } catch (err) {
    return new Response('state error', {status: 500});
  }

  const responseAccessToken = await GITHUB.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data.access_token);
  const userData = await responseUserData.json();

  const base64cookieToken = await encodeBase64Token(SESSION_SECRET, {
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