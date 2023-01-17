import {decodeBase64Token, encodeBase64Token, hashKey256} from "../AES-GCM";
import {readCookies} from "./cookie";

const ttl = 10000;

//1. on the incoming request, we need to check if the session is good.
//2. on the incoming request with an unwrapped cookie, we add a rollCookie if rollTime
//3. then we make the response depending on the state of the session


let cookieKey;

async function addKeys({data}) {
  data.cookieKey = cookieKey ??= await hashKey256("hello sunshine");
}

async function decryptCookie({request, data}) {
  try {
    const sessionCipher = readCookies(request).id;
    if (sessionCipher)
      data.session = await decodeBase64Token(sessionCipher, data.cookieKey);
  } catch (err) { //no valid session cookie
  }
}

async function makeCookieText(dict, request) {
  const cookieCode = await encodeBase64Token(cookieKey, dict);
  return `id=${cookieCode}; Domain=${new URL(request.url).hostname}; SameSite=LAX; Max-Age=${dict.ttl / 1000}; secure; httpOnly`;
}

async function rollCookie({request, data, response}) {
  const session = data.session;
  if (session && (session.ttl * 2 / 3) < new Date().getTime() - session.iat) {   //we can roll
    session.ip = request.headers.get("CF-Connecting-IP");
    //session.ttl = ttl; //todo should we?
    response.headers.set("Set-Cookie", await makeCookieText(session, request));
  }
}

async function addCookie({request, data, response}) {
  if (!data.session) {
    const dict = {
      ttl,
      user: "test@test",
      ip: request.headers.get("CF-Connecting-IP")
    };
    response.headers.set("Set-Cookie", await makeCookieText(dict, request));
  }
}

export async function onRequest(context) {
  await addKeys(context);  //or rename to addCookieKey??. That is not that bad. And have more than one such function. Or ..."COOKIE_KEY"++
  await decryptCookie(context);//decryptSession
  context.response = new Response(JSON.stringify(context.data.session ?? null, null, 2));
  await rollCookie(context);
  await addCookie(context);
  return context.response;
}