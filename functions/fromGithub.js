import {GITHUB, bakeCookie} from "./AUTH";
import {Base64Token} from "./AES-GCM";
import {appContext} from "./APP";

const whitelist = {
  timeStamp: 1,
  request: {
    url: {
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
  let state = (proxy ??= appContext(context.env.SESSION_SECRET)).filter(whitelist, context);
  state instanceof Promise && (state = await state);
  const {
    request, env: {
      GITHUB_CLIENT_ID,
      GITHUB_REDIRECT,
      GITHUB_CLIENT_SECRET,
      STATE_SECRET,
      SESSION_SECRET,
      SESSION_TTL
    }
  } = context;
  const {code, state: stateParam} = state.request.url.searchParams;
    const emptyBase64Token = await Base64Token.decode(STATE_SECRET, stateParam);
  if(!emptyBase64Token)
    return new Response('state error', {status: 500});

  const responseAccessToken = await GITHUB.fetchAccessToken(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, stateParam);
  const data = await responseAccessToken.json();
  const responseUserData = await GITHUB.fetchUserData(data.access_token);
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