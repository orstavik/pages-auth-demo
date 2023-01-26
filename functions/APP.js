import {ContextProxy} from "./ContextProxy";
import {Base64Token} from "./AES-GCM";

let proxy;
export function appContext(context){
  return proxy ??= new ContextProxy({
    //generic paths (all cloudflare pages contexts)
    ".request.url": ContextProxy.parseUrl,
    ".request.url.searchParams": ContextProxy.parseSearchParams,
    ".request.headers": ContextProxy.wrapHeaderProxy,
    ".request.headers.cookie": ContextProxy.parseCookie,
    //app specific paths (can vary from app to app)
    ".request.headers.cookie.id": Base64Token.cachingDecoder(context.env.SESSION_SECRET),
    ".env.rights": JSON.parse,
    ".request.body": JSON.parse,
  });
}