import {decodeBase64Token, hashKey256} from "./AES-GCM";


let cookieKey;

export async function onRequest({request, env: {}}) {
  const cStr = request.headers.get("Cookie");
  if (!cStr)
    return Response.redirect(new URL("/login", request.url));

  const cookies = Object.fromEntries(cStr.split(";").map(i => i.split("=").map(s => s.trim())));
  if (!cookies.id)
    return Response.redirect(new URL("/login", request.url));

  cookieKey ??= await hashKey256("hello sunshine");
  const sessionTtl = 100000;
  try {
    const dict = await decodeBase64Token(cookies.id, cookieKey, sessionTtl);
    return new Response("Hello: " + JSON.stringify(dict, null, 2), {status: 200});
  } catch (err) {
    return Response.redirect(new URL("/login", request.url));
  }
}