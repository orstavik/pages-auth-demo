export async function onRequest({request, env}) {
  const hello = "hello sunshine";
  const secret = "secret";
  return new Response(JSON.stringify({hello, secret}));
}