import {appContext3} from "../../APP";

//todo how to deal with lower case letters?
const whitelist2 = {
  now: {
    ip: "request.headers.CF-Connecting-IP",
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
  let state2 = (proxy ??= appContext3(context.env, whitelist2)).filter(context);
  state2 instanceof Promise && (state2 = await state2);

  return new Response(JSON.stringify(state2, null, 2));
}