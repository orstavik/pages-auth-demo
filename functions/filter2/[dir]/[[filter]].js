import {appContext3} from "../../APP";
import {Base64Token} from "../../AES-GCM";
import {reverseFilter} from "../../ResponseProxy";

const whitelist2 = {
  now: {
    ip: "request.headers.cf-connecting-ip",
    iat: "timeStamp",
    ttl: "env.SESSION_TTL"
  },
  url: "request.url.href",
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

  let resp = await produceResponse(state, context.env);
  if (resp instanceof Promise) resp = await resp;
  console.log(JSON.stringify(resp, null, 2));

  return new Response(JSON.stringify(state, null, 2));
}

async function produceResponse(state, {SESSION_SECRET}) {

  async function bakeCookies(obj) {
    if (!obj) return;
    await Promise.all(Object.values(obj));
    return obj ? Object.entries(obj).map(([k, v]) => `${k}${v ? '=' + v.value : ''}`) : undefined;
  }

  async function rollSessionCookie(session, SESSION_SECRET) {
    if (!session)
      return;
    const now = Date.now();
    if ((session.ttl * 1000 / 2) + session.iat < now && false)
      return;
    const cookie = Object.assign({}, session);
    cookie.iat = now;
    cookie.value = await Base64Token.encode(SESSION_SECRET, cookie);
    return cookie;
  }

  const map = {
    body: "output.body",
    status: "output.status",
    statusText: "output.statusText",
    "headers.Location": "output.Location",
    // "headers.Set-Cookie.id": ["now", makeSessionCookie],
    "headers.Set-Cookie.id": ["session", s => rollSessionCookie(s, SESSION_SECRET)],
    //this will only produce a cookie under specific circumstances
    "headers.Set-Cookie": bakeCookies
  };

  return reverseFilter(map, state);
}