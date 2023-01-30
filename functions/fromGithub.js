import {bakeCookie, GITHUB} from "./AUTH";
import {Base64Token} from "./AES-GCM";
import {appContext2} from "./APP";

const whitelist = {
  timeStamp: 1,
  request: {
    headers: {
      "CF-Connecting-IP": 1
    },
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
    rights: 1
  }
};
let proxy;

export async function onRequest(context) {
  let state = (proxy ??= appContext2(context.env)).filter(whitelist, context);
  state instanceof Promise && (state = await state);
  const {
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT,
    GITHUB_CLIENT_SECRET,
    SESSION_SECRET,
    SESSION_TTL
  } = context.env;
  if (!state.request.url.searchParams.state)
    return new Response('state error', {status: 500});

  const responseAccessToken = await GITHUB.fetchAccessToken(state.request.url.searchParams.code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data.access_token);
  const userData = await responseUserData.json();
  const user = userData.login + "@github";
  const rights = state.env.rights[user];

  state.output = {headers: {cookie: {}}};
  //this is a pure mapping.
  const ip = state.request.headers["CF-Connecting-IP"];
  state.output.headers.cookie.id = {
    user,
    ttl: SESSION_TTL,
    rights,
    ip
  };


  //todo this is a pure function that converts the state output to a Response object
  const base64cookieToken = await Base64Token.encode(SESSION_SECRET, state.output);
  const response = Response.redirect(new URL("/", state.request.url.href));
  response.headers.set("Set-Cookie",
    bakeCookie("id", base64cookieToken, state.request.url.hostname, SESSION_TTL));
  return response;
}