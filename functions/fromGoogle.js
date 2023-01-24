import {bakeCookie, GOOGLE} from "./AUTH";
import {decodeBase64Token, encodeBase64Token} from "./AES-GCM";

export async function onRequest(context) {
  const {request, env: {GOOGLE_CLIENT_ID, GOOGLE_CODE_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, STATE_SECRET, SESSION_SECRET, SESSION_TTL}} = context;
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  try {
    const emptyBase64Token = await decodeBase64Token(STATE_SECRET, state);
  } catch (err) {
    return new Response('state error', {status: 500});
  }
  const payload = await GOOGLE.getUserData(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, 'authorization_code');

  const base64cookieToken = await encodeBase64Token(SESSION_SECRET, {
    user: payload.email,
    rights: "edit,admin", //todo this we need to get from the environment variables
    ip: request.headers.get("CF-Connecting-IP"),
    ttl: SESSION_TTL        
  });
  const response = Response.redirect(new URL("/", request.url));
  response.headers.set("Set-Cookie",
    bakeCookie("id", base64cookieToken, new URL(request.url).hostname, SESSION_TTL));
  return response;
}