export async function onRequest({request}) {
  return new Response("", {
    status: 302,
    headers: {
      "Location": new URL("/", request.url),
      "Set-cookie": "id=''; max-age=0"
    }
  });
}