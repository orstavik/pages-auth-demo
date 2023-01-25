import {Base64Token} from "./AES-GCM";

function parseCookie(cookieString) {
  return Object.fromEntries(cookieString.split(";").map(p => p.split(/=(.+)/).map(s => s?.trim())));
}

async function getAndValidateSessionCookie(request, key) {
  const cStr = request.headers.get("Cookie");
  if (cStr) {
    const cookies = parseCookie(cStr);
    if (cookies.id) {
      try {
        return await Base64Token.decode(key, cookies.id);
      } catch (err) {
      }
    }
  }
}

export async function onRequest({request, env: {SESSION_SECRET}}) {
  const cookieAsObj = await getAndValidateSessionCookie(request, SESSION_SECRET);
  if (cookieAsObj)
    return new Response("Safe, cookie content: " + JSON.stringify(cookieAsObj, null, 2), {status: 200});
  return Response.redirect(new URL("/login", request.url));
}