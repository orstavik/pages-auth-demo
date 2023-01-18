import {decodeBase64Token, encodeBase64Token, hashKey256} from "../AES-GCM";
import {readCookies} from "./cookie";

const ttl = 10000;

//1. on the incoming request, we need to check if the session is good.
//2. on the incoming request with an unwrapped cookie, we add a rollCookie if rollTime
//3. then we make the response depending on the state of the session


let cookieKey;

async function addKeys(request) {
  request.cookieKey = cookieKey ??= await hashKey256("hello sunshine");
  return request;
}

async function decryptCookie(request) {
  try {
    cookieKey ??= await hashKey256("hello sunshine");
    const sessionCipher = readCookies(request).id;
    if (sessionCipher)
      request.session = await decodeBase64Token(sessionCipher, cookieKey);
  } catch (err) { //no valid session cookie
  }
  return request;
}

async function makeCookieText(dict, request) {
  const cookieCode = await encodeBase64Token(cookieKey, dict);
  return `id=${cookieCode}; Domain=${new URL(request.url).hostname}; SameSite=LAX; Max-Age=${dict.ttl / 1000}; secure; httpOnly`;
}

async function rollCookie(request, response) {
  const session = request.session;
  if (session && (session.ttl * 2 / 3) < new Date().getTime() - session.iat) {   //we can roll
    session.ip = request.headers.get("CF-Connecting-IP");
    //session.ttl = ttl; //todo should we?
    response.headers.set("Set-Cookie", await makeCookieText(session, request));
  }
  return response;
}

async function addCookie(request, response) {
  if (!request.session) {
    const dict = {
      ttl,
      user: "test@test",
      ip: request.headers.get("CF-Connecting-IP")
    };
    response.headers.set("Set-Cookie", await makeCookieText(dict, request));
  }
  return response;
}

export async function onRequest({request}) {
  request = await addKeys(request);
  request = await decryptCookie(request);
  let response = new Response(JSON.stringify(request.session ?? null, null, 2));
  response = await rollCookie(request, response);
  response = await addCookie(request, response);
  return response;
}