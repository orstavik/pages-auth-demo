import {ContextProxy} from "../../ContextProxy";
import {decodeBase64Token} from "../../AES-GCM";

const whitelist3 = {
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

export async function onRequest(context) {
  filter ??= new ContextProxy({
      //generic cloudflare pages paths
      ".request.url": v => new URL(v),
      ".request.url.searchParams": ContextProxy.parseSearchParams,
      ".request.headers": ContextProxy.wrapHeaderProxy,
      ".request.headers.cookie": ContextProxy.parseCookie,
      //app specific paths
      // ".request.headers.cookie.id": async c => {
      //   const bob = await decodeBase64Token(context.env.SESSION_SECRET, c);
      //   return bob
      // },
      ".env.rights": JSON.parse,
      ".request.body": JSON.parse,
    });
  context.state = filter.process(whitelist3, context);
  context.state.request.headers.cookie.id =
    await decodeBase64Token(context.env.SESSION_SECRET, context.state.request.headers.cookie.id);
  return new Response(JSON.stringify(context.state, null, 2));
}