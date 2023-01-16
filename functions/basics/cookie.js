export function readCookies(request) {
  const cStr = request.headers.get("Cookie");
  return cStr ? Object.fromEntries(cStr.split(";").map(i => i.split("=").map(s => s.trim()))): {};
}

//1. convert incoming cookies to a dictionary
//2. add the incoming cookies as text in a response
//3. respond with cookies
export async function onRequest({request}) {
  const cookies = readCookies(request);
  const response = new Response(JSON.stringify(cookies, null, 2));
  response.headers.set("Set-Cookie", [
    `hello=world`,                                               //a. add hello world
    `hello=sunshine${new Date().getTime()};`,                    //b. overwrite hello=world with hello=sunshine
    `sunshine=hello;` + (Math.random() > .5 ? "max-age=0" : "")  //c. randomly add/remove sunshine=hello
  ]);
  return response;
}