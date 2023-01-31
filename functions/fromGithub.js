import {bakeCookie, GITHUB} from "./AUTH";
import {Base64Token} from "./AES-GCM";
import {appContext2} from "./APP";
import {ContextProxy} from "./ContextProxy";

const whitelist = {
  timeStamp: 1,                      //
  request: {
    headers: {                         //
      "cf-connecting-ip": 1            //
    },                                 //
    url: {
      hostname: 1,
      href: 1,
      searchParams: {
        state: 1,
        code: 1
      }
    }
  },
  env: {
    rights: 1,
    SESSION_TTL: 1                   //
  }
};
let proxy;

export async function onRequest(context) {
  let state = (proxy ??= appContext2(context.env)).filter(whitelist, context);
  state instanceof Promise && (state = await state);
  state.now = ContextProxy.extract({
    ip: "request.headers.cf-connecting-ip",
    ttl: "env.SESSION_TTL",     //todo this doesn't belong here..
    iat: "timeStamp",
  }, state);

  if (!state.request.url.searchParams.state) //1. kv with error, and 2. return response
    return new Response('invalid state', {status: 500});

  const accessToken = await GITHUB.accessToken(
    state.request.url.searchParams.code,
    context.env.GITHUB_CLIENT_ID,
    context.env.GITHUB_REDIRECT,
    context.env.GITHUB_CLIENT_SECRET
  );
  const user = state.now.user = await GITHUB.user(accessToken); //todo get the user
  state.now.rights = state.env.rights[user];                   //todo redactive filter..
  //1. handle errors like above

  //todo this is a pure function that converts the state output to a Response object
  const base64cookieToken = await Base64Token.encode(context.env.SESSION_SECRET, state.now);
  const response = Response.redirect(new URL("/", state.request.url.href));
  response.headers.set("Set-Cookie", bakeCookie("id", base64cookieToken, state.request.url.hostname, context.env.SESSION_TTL));
  return response;
  //1. put in kv and 2. return the expected Response
}