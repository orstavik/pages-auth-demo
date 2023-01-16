export async function onRequest({request}) {
  const headers = Object.fromEntries(new Map(request.headers).entries());
  return new Response(JSON.stringify(headers, null, 2));
}