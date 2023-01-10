export async function onRequest({request}){
  console.log("bob", Object.fromEntries(request.headers));
  return new Response("hello sunshine in Lviv and Tønsberg!");
}