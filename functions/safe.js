import {decodeBase64Token, hashKey256} from "./AES-GCM";

let cookieKey;

async function getAndValidateSessionCookie(request, SESSION_TTL, key) {
  const cStr = request.headers.get("Cookie");
  if (cStr) {
    const cookies = Object.fromEntries(cStr.split(";").map(i => i.split("=").map(s => s.trim())));
    if (cookies.id) {
      try {
        return await decodeBase64Token(cookies.id, key, SESSION_TTL);
      } catch (err) {
      }
    }
  }
}

export async function onRequest({request, env: {SESSION_SECRET, SESSION_TTL}}) {
  cookieKey ??= await hashKey256(SESSION_SECRET);
  const cookieAsObj = await getAndValidateSessionCookie(request, SESSION_TTL,  cookieKey);
  if (cookieAsObj)
    return new Response("Safe, cookie content: " + JSON.stringify(cookieAsObj, null, 2), {status: 200});
  return Response.redirect(new URL("/login", request.url));
}