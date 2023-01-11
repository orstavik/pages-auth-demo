import {decode, sign, verify} from "./JWT";

export async function onRequest({request, env}){
  const hello = "hello sunshine";
  const secret = "secret";
  const encrypted = await sign({hello}, secret);
  const verified = await verify(encrypted, secret);
  const decoded = await decode(encrypted);
  return new Response(JSON.stringify({hello, secret, encrypted, verified, decoded}));
}