import {bakeCookie, GOOGLE} from "./AUTH";
import {Base64Token} from "./AES-GCM";
import {appContext2} from "./APP";

const whitelist = {
  timeStamp: 1,
  request: {
    headers: {
      "CF-Connecting-IP": 1
    },
    url: {
      href: 1,
      hostname: 1,
      searchParams: {
        code: 1,
        state: 1
      }
    }
  },
  env: {
    rights: 1
  }
}

let proxy;

export async function onRequest(context) {
  let state = (proxy ??= appContext2(context.env)).filter(whitelist, context);
  state instanceof Promise && (state = await state);

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CODE_LINK,
    GOOGLE_REDIRECT,
    GOOGLE_CLIENT_SECRET,
    SESSION_SECRET,
    SESSION_TTL
  } = context.env;
  const {code, state: stateParam} = state.request.url.searchParams;
  if (!stateParam)
    return new Response('state error', {status: 500});

  const payload = await GOOGLE.getUserData(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, 'authorization_code');

  const base64cookieToken = await Base64Token.encode(SESSION_SECRET, {
    user: payload.email,
    rights: state.env.rights[payload.email],
    ip: state.request.headers["CF-Connecting-IP"],
    ttl: SESSION_TTL
  });
  const response = Response.redirect(new URL("/", state.request.url.href));
  response.headers.set("Set-Cookie",
    bakeCookie("id", base64cookieToken, state.request.url.hostname, SESSION_TTL));
  return response;
}