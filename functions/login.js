// function randomString(length) {
//   const iv = crypto.getRandomValues(new Uint8Array(length));
//   return Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
// }
//
// function makeState(key) {
//   //todo the state can be an encrypted value. with a timestamp. and an ip address. and an iv.
//   //todo that way we sign the encrypted value.
//   //todo the state should be a timestamp, and this timestamp should be encrypted using an algorithm.
//   return randomString(12);
// }

import {GITHUB} from "./GITHUB";
import {encodeTimestamp, hashKey256} from "./AES-GCM";

let stateKey;
export async function onRequest({request, env}) {
  stateKey ??= await hashKey256(env.STATE_SECRET)
  const state = await encodeTimestamp(stateKey);
  const href = GITHUB.loginLink(env, state);
  return Response.redirect(href);
}