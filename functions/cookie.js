export async function onRequest({request}) {
  //1. convert incoming cookies to a dictionary
  const cStr = request.headers.get("Cookie");
  const cookies = cStr && Object.fromEntries(cStr.split(";").map(i=>i.split("=").map(s=>s.trim())));
  //2. add the incoming cookies as text in a response
  const response = new Response(JSON.stringify(cookies, null, 2));
  //3. respond with cookies
  //a. add hello world
  response.headers.set("Set-Cookie", `hello=world`);
  //b. overwrite hello=world with hello=sunshine
  response.headers.set("Set-Cookie", `hello=sunshine${new Date().getTime()};`);
  //c. add sunshine=hello. Half the time remove this cookie, half the time add it.
  response.headers.set("Set-Cookie", `sunshine=hello;` + (Math.random() > .5 ? "max-age=0" : ""));
  return response;
}