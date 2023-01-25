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

let filter;

async function asyncMutator(path, func, obj) {
  path = path.split(".");
  const prop = path.pop();
  while (obj && path.length)
    obj = obj[path.shift()];
  if (path.length === 0)
    obj[prop] = await func(obj[prop]);
}

export async function onRequest(context) {
  filter ??= new ContextProxy({
    ".request.url": v => new URL(v),
    ".request.url.searchParams": ContextProxy.parseSearchParams,
    ".request.headers": ContextProxy.wrapHeaderProxy,
    ".request.headers.cookie": ContextProxy.parseCookie,

    ".env.rights": JSON.parse,
    ".request.body": JSON.parse,
  });
  context.state = filter.process(whitelist, context);

  const path = "request.headers.cookie.id";
  const decoder = Base64Token.decode.bind(null, context.env.SESSION_SECRET);  //todo this can be made into a HO function.
  await asyncMutator(path, decoder, context.state);

  // if (context.state.request.headers.cookie?.id)
  //   context.state.request.headers.cookie.id =
  //     await decodeBase64Token(context.env.SESSION_SECRET, context.state.request.headers.cookie.id);

  return new Response(JSON.stringify(context.state, null, 2));
}