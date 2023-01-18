export async function onRequest(context) {
  const data = {...context};
  data.request = {...context.request};
  data.request.headers = Object.fromEntries(new Map(context.request.headers).entries());
  return new Response(JSON.stringify(data, null, 2));
}