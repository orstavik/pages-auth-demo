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

let proxy;

export async function onRequest(context) {
  let state = (proxy ??= appContext(context.env.SESSION_SECRET)).filter(whitelist, context);
  state instanceof Promise && (state = await state);
  const session = state.request.headers.cookie.id;
  if (!session)
    return Response.redirect(new URL("/login", state.request.url));
  return new Response("Safe, cookie content: " + JSON.stringify(session, null, 2), {status: 200});
}