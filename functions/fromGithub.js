import {bakeCookie, GITHUB} from "./AUTH";
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

  if (!state.state) //1. kv with error, and 2. return response
    return new Response('invalid state', {status: 500});

  const accessToken = await GITHUB.accessToken(
    state.code,
    context.env.GITHUB_CLIENT_ID,
    context.env.GITHUB_REDIRECT,
    context.env.GITHUB_CLIENT_SECRET
  );
  const user = state.now.user = await GITHUB.user(accessToken); //get the user
  state.now.rights = state.rights[user];                    //todo redactive filtering?
  //1. handle errors like above

  //todo this is a pure function that converts the state output to a Response object
  const base64cookieToken = await Base64Token.encode(context.env.SESSION_SECRET, state.now);
  const response = Response.redirect(new URL("/", state.url));
  response.headers.set("Set-Cookie", bakeCookie("id", base64cookieToken, state.hostname, state.now.ttl));
  return response;
  //1. put in kv and 2. return the expected Response
}