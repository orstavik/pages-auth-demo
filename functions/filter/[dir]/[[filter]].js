import {ContextProxy} from "../../ContextProxy";
import {Base64Token} from "../../AES-GCM";

const whitelist = {
  request: {
    method: 1,
    url: {
      href: 1,
      searchParams: {
        bob: 1
      }
    },
    body: 1,
    headers: {
      "cf-connecting-ip": 1,
      "cf-ray": 1,
      cookie: {
        hello: 1,
        id: 1
      },
    },
    cf: {
      asn: 1,
      colo: 1,
      longitude: 1,
      latitude: 1,
    }
  },
  functionPath: 1,
  params: 1,
  env: {
    rights: 1
  }
};

let contextProxy;

async function asyncMutator(path, func, obj) {
  path = path.split(".");
  const prop = path.pop();
  while (obj && path.length)
    obj = obj[path.shift()];
  if (path.length === 0)
    obj[prop] = await func(obj[prop]);
}

export async function onRequest(context) {
  contextProxy ??= new ContextProxy({
    ".request.url": v => new URL(v),
    ".request.url.searchParams": ContextProxy.parseSearchParams,
    ".request.headers": ContextProxy.wrapHeaderProxy,
    ".request.headers.cookie": ContextProxy.parseCookie,

    ".env.rights": JSON.parse,
    ".request.body": JSON.parse,
  });
  context.state = contextProxy.process(whitelist, context);

  await asyncMutator(
    "request.headers.cookie.id", v => Base64Token.decode(context.env.SESSION_SECRET, v), context.state);

  return new Response(JSON.stringify(context.state, null, 2));
}