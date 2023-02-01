import {appContext3} from "../../APP";
import {Base64Token} from "../../AES-GCM";

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

  await produceResponse(state, context.env);

  return new Response(JSON.stringify(state, null, 2));
}

async function produceResponse(state, {SESSION_SECRET}) {

  async function bakeCookies(obj) {
    await new Promise(setTimeout);
    return Object.entries(obj).map(([k, v]) => `${k}=${v.value}`);
  }

  function makeSessionCookie(obj) {
    return {value: btoa(JSON.stringify(obj))};
  }

  const map = {
    body: "output.body",
    status: "output.status",
    statusText: "output.statusText",
    "headers.Location": "output.Location",
    "headers.Set-Cookie.id": ["now", makeSessionCookie],
    // "headers.Set-Cookie.id": ["session", rollSessionCookie], //this will only produce a cookie under specific circumstances
    "headers.Set-Cookie": bakeCookies
  };

  function getProp(obj, path, blankFill) {
    for (let i = 0; obj && i < path.length; i++)
      obj = obj[path[i]] ??= blankFill ? {} : undefined;
    return obj;
  }

  function getValues(filter, state) {
    const res = {};
    //normalize the sortedFilters
    const sortedFilters = Object.entries(filter)
      .sort((a, b) => b[0].length - a[0].length)
      .map(([k,v]) => {
        const resPath = k.split(".");
        const prop = resPath.pop();
        return [[resPath, prop], v instanceof Array ? [v[0].split("."), v[1]] : v instanceof Function ? [, v] : [v.split(".")]];
      });

    const awaits = [];
    //this is the task that we need to do when we produce the output. doesn't handle await yet.
    for (let [[parentPath, prop], [stateP, process]] of sortedFilters) {
      let val = stateP && getProp(state, stateP);//1. get the value.
      const obj = getProp(res, parentPath, true);
      val ??= obj[prop];
      process && (val = process(val));
      if(val instanceof Promise)
        awaits.push(val), val.then(v=> obj[prop] = v);
      else
        obj[prop] = val;
    }
    return awaits.length ? Promise.all(awaits).then(_ => res) : res;
  }

  let resp = getValues(map, state);
  if(resp instanceof Promise) resp = await resp;
  console.log(JSON.stringify(resp, null, 2));
}
