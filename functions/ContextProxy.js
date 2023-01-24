export class ContextProxy {
  static #map = new Map([
    [Headers, {
      get(target, key) {
        const value = target.get(key);
        return key === "cookie" ? Object.fromEntries(new URLSearchParams(value).entries()) :
          value || target[key];
      }
    }],
    [URLSearchParams, {
      get(target, key) {
        return target.get(key) || target[key];
      }
    }],
    [Request, {
      get(target, key) {
        if (key === "body" && target.headers.get("content-type") === "application/json")
          return JSON.parse(target[key]);
        if (key === "url")
          return new URL(target[key]);
        return target[key];
      }
    }]
  ]);

  static get(obj) {
    const handler = this.#map.get(obj.constructor);
    return handler ? new Proxy(obj, handler) : obj;
  }

  static filter(f, obj) {
    if(obj === null || obj === undefined)
      return null;
    obj = ContextProxy.get(obj);
    const res = {};
    for (let [key, value] of Object.entries(f))
      res[key] = value === 1 ? obj[key] ?? null : ContextProxy.filter(value, obj[key]);
    return res;                         //todo we can skip null here.. but then we don't see that we look for it.
  }
}