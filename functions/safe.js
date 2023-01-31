import {appContext, appContext3} from "./APP";

const redirectResponse = [
  "Unauthorized",
  {
    status: 302,
    headers: {
      Location: "/login"
    }
  }
];

function redirectWhenNoSession(session, location) {
  if (session?.rights.indexOf(location.split("/")[1]) < 0)
    return redirectResponse;
}

const whitelist2 = {
  now: {
    ip: "request.headers.cf-connecting-ip",
    iat: "timeStamp",
    ttl: "env.SESSION_TTL"
  },
  url: "request.url.href",
  pathname: "request.url.pathname",
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

  //2. check that there is a valid session.
  state.response = redirectWhenNoSession(state.session, state.pathname);

  //3. if the state.response is still open for business, then add the body
  state.response ??= [JSON.stringify(state, null, 2)];

  //4. save the state

  //5. convert the state to a response+
  return new Response(...state.response);
}