export async function onRequest({request, env}){
  const res = `<pre>
hello sunshine
GITHUB_CLIENT_ID=${env.GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${env.GITHUB_CLIENT_SECRET}
GITHUB_REDIRECT=${env.GITHUB_REDIRECT}
</pre>`;
  return new Response(res);
}