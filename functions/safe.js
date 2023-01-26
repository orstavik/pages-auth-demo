import {appContext} from "./APP";

const whitelist = {
  request: {
    headers: {
      cookie: {
        id: 1
      }
    }
  }
}

let proxy;
export async function onRequest(context) {
  proxy ??= appContext(context);
  context.state = proxy.filter(whitelist, context);
  context.state instanceof Promise && (context.state = await context.state);
  const session = context.state?.request?.headers?.cookie?.id;
  if (!session)
    return Response.redirect(new URL("/login", context.request.url));
  return new Response("Safe, cookie content: " + JSON.stringify(session, null, 2), {status: 200});
}