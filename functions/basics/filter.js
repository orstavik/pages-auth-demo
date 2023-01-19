const whitelist = {
  request: {
    method: 1,
    url: {
      href: 1,
      searchParams: {
        bob: 1
      }
    },
    body: 1,
    headers: {
      "cf-connecting-ip": 1,
      "cf-ray": 1,
      cookie: {
        hello: 1,
        bob: 1
      },
    },
    cf: {
      asn: 1,
      colo: 1,
      longitude: 1,
      latitude: 1,
    }
  },
  functionPath: 1,
}

class ContextProxy {
  static #map = new Map([
    [Headers, {
      get(target, key) {
        const value = target.get(key);
        if (key === "cookie")
          return value ? Object.fromEntries(value.split(";").map(s => s.trim()).map(i => i.split("="))) : {};
        return value || target[key];
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

export async function onRequest(context) {
  context.state = ContextProxy.filter(whitelist, context);
  return new Response(JSON.stringify(context.state, null, 2));
}