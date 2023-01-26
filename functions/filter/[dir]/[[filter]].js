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

const contextProxy = new ContextProxy({
  ".request.url": v => new URL(v),
  ".request.url.searchParams": ContextProxy.parseSearchParams,
  ".request.headers": ContextProxy.wrapHeaderProxy,
  ".request.headers.cookie": ContextProxy.parseCookie,

  ".env.rights": JSON.parse,
  ".request.body": JSON.parse,
});

async function asyncMutator(path, func, obj) {
  path = path.split(".");
  const prop = path.pop();
  while (obj && path.length)
    obj = obj[path.shift()];
  if (path.length === 0)
    obj[prop] = await func(obj[prop]);
}

export async function onRequest(context) {
  context.state = contextProxy.filter(whitelist, context);

  await asyncMutator(
    "request.headers.cookie.id", v => Base64Token.decode(context.env.SESSION_SECRET, v), context.state);
  //todo the rights are added in the cookie inside the fromGithub/fromGoogle endpoints.
  //todo check the auth. Is there an unwrapped cookie with data? does the cookie.id.rights include the current path? If this is not the case, then a redirect to login.

  //todo then roll the cookie. if the time left is less than half the ttl,
  // 1. the we do this by copying the cookie from the cookie.id => response.set-cookie, and then add the ttl to the ttl, and
  // 2. then then add ttl - timeleft to max-age.
  // 3. then encode the cookie. and then bakeCookie
  // the roll cookie is an async operat ion because of encryption.

  //todo add the response

  //todo write to kv

  //todo then convert the response body and return it

  return new Response(JSON.stringify(context.state, null, 2));
}