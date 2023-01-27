import {ContextProxy} from "./ContextProxy";
import {Base64Token} from "./AES-GCM";

let proxy;
export function appContext(SESSION_SECRET){
  return proxy ??= new ContextProxy({
    //generic paths (all cloudflare pages contexts)
    ".timeStamp": _=> new Date().getTime(),
    ".request.url": ContextProxy.parseUrl,
    ".request.url.searchParams": ContextProxy.parseSearchParams,
    ".request.headers": ContextProxy.wrapHeaderProxy,
    ".request.headers.cookie": ContextProxy.parseCookie,
    //app specific paths (can vary from app to app)
    ".request.headers.cookie.id": Base64Token.cachingDecoder(SESSION_SECRET),
    ".env.rights": JSON.parse,
    ".request.body": JSON.parse,
  });
}