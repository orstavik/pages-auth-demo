import {decodeBase64Token} from "./AES-GCM";

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
  const cookieAsObj = await getAndValidateSessionCookie(request, SESSION_TTL,  SESSION_SECRET);
  if (cookieAsObj)
    return new Response("Safe, cookie content: " + JSON.stringify(cookieAsObj, null, 2), {status: 200});
  return Response.redirect(new URL("/login", request.url));
}