import {ContextProxy} from "./ContextProxy";
import {Base64Token} from "./AES-GCM";

let proxy;
export function appContext(SESSION_SECRET){
  const allApps = {
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
  };
  return proxy ??= new ContextProxy(allApps);
}

let proxy2;
export function appContext2({SESSION_SECRET, STATE_SECRET}){
  return proxy2 ??= new ContextProxy({
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
    //fromOAuth server specific
    ".request.url.searchParams.state": v => Base64Token.decode(STATE_SECRET, v)
  });
}