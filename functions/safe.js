import {appContext} from "./APP";

const whitelist = {
  request: {
    url: 1,
    headers: {
      cookie: {
        id: 1
      }
    }
  }
};

const redirectResponse = [
  "Unauthorized",
  {
    status: 302,
    headers: {
      Location: "/login"
    }
  }
];

let proxy;

function redirectWhenNoSession(session) {
  if (session)         //and the session has the rights to this base
    return;
  return redirectResponse;
}

export async function onRequest(context) {
  //1. normalize the incoming request and environment. This includes decrypting cookies.
  let state = (proxy ??= appContext(context.env.SESSION_SECRET)).filter(whitelist, context);
  state instanceof Promise && (state = await state);

  //2. check that there is a valid session.
  state.response = redirectWhenNoSession(state.request.headers.cookie.id);

  //3. if the state.response is still open for business, then add the body
  state.response ??= [JSON.stringify(state, null, 2)];

  //4. save the state

  //5. convert the state to a response
  return new Response(...state.response);
}