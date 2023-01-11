function randomString(length) {
  const iv = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

function makeState(key) {
  //todo the state should be a timestamp, and this timestamp should be encrypted using an algorithm.
  return randomString(12);
}

import {GITHUB} from "./GITHUB";

export async function onRequest({request, env}) {
  const href = GITHUB.loginLink(env, makeState(env.STATESECRET));
  return Response.redirect(href);
}