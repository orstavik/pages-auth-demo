import {encode, decode, hashKey256} from "./AES-GCM";

let cookieKey;

export async function onRequest({request}) {
  cookieKey ??= await hashKey256("hello sunshine");

  //1. convert incoming cookies to a dictionary
  const cStr = request.headers.get("Cookie");
  const cookies = cStr && Object.fromEntries(cStr.split(";").map(i => i.split("=").map(s => s.trim())));

  //2. decrypt id cookie
  //todo decode can throw error.
  const payload = cookies.id ? await decode(cookies.id, cookieKey) : null;

  //2b. check if cookie.ok.
  //todo 0 redo, 1 rollover, 2 ok
  const obj = JSON.parse(payload);
  const ttl = 10 * 1000;   //10sek
  const now = new Date().getTime();
  if (obj?.iat)
    obj.ok = obj.iat <= now && now <= obj.iat + ttl;

  //3. make a response with the decoded
  const response = new Response(JSON.stringify(obj, null, 2));

  //3b. if cookie.ok, skip making new cookie
  if (obj?.ok)
    return response;

  //4. make a new id cookie going out
  const cookieDough = {
    user: "test@test",
    iat: now,
    ip: request.headers.get("CF-Connecting-IP")
  };

  //5. encrypt the session id cookie and add it to the response
  const cookieTxt = await encode(JSON.stringify(cookieDough), cookieKey);
  const hostname = new URL(request.url).hostname;
  response.headers.set("Set-Cookie", `id=${cookieTxt}; Domain=${hostname}; SameSite=LAX; Max-Age=${ttl / 1000}; secure; httpOnly`);
  return response;
}
