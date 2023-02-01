import {bakeCookie, GOOGLE} from "./AUTH";
import {Base64Token} from "./AES-GCM";
import {appContext3} from "./APP";

const whitelist2 = {
  now: {
    ip: "request.headers.cf-connecting-ip",
    iat: "timeStamp",
    ttl: "env.SESSION_TTL"                     //todo move this out of now.
  },
  url: "request.url.href",
  pathname: "request.url.pathname",
  hostname: "request.url.hostname",
  session: "request.headers.cookie.id",
  state: "request.url.searchParams.state",
  code: "request.url.searchParams.code",
  rights: "env.rights"
};
let proxy;

export async function onRequest(context) {
  proxy ??= appContext3(context.env, whitelist2);
  let state = proxy.filter(context);
  state instanceof Promise && (state = await state);

  if (!state.state)
    return new Response('state error', {status: 500});

  const payload = await GOOGLE.getUserData(
    state.code,
    context.env.GOOGLE_CODE_LINK,
    context.env.GOOGLE_CLIENT_ID,
    context.env.GOOGLE_REDIRECT,
    context.env.GOOGLE_CLIENT_SECRET
  );

  state.now.user = payload.email;                              //get the user
  state.now.rights = state.rights[state.now.user] ?? null;     //todo redactive filtering?

  const base64cookieToken = await Base64Token.encode(context.env.SESSION_SECRET, state.now);
  const response = Response.redirect(new URL("/", state.url));
  response.headers.set("Set-Cookie",
    bakeCookie("id", base64cookieToken, state.hostname, state.ttl));
  return response;
}