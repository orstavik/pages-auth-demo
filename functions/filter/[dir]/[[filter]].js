import {appContext} from "../../APP";

const whitelist = {
  timeStamp: 1,
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
let proxy;

export async function onRequest(context) {
  proxy ??= appContext(context.env.SESSION_SECRET);
  context.state = proxy.filter(whitelist, context);
  if(context.state instanceof Promise)
    context.state = await context.state;

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