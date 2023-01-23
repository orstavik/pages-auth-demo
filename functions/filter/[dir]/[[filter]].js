import {ContextProxy} from "../../ContextProxy";

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
        bob: 1
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

export async function onRequest(context) {
  context.state = ContextProxy.filter(whitelist, context);
  context.state.env.rights = JSON.parse(context.state.env.rights);
  return new Response(JSON.stringify(context.state, null, 2));
}