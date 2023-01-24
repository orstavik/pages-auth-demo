export class ContextProxy {
  constructor(...paths) {
    this.paths = Object.assign({}, ...paths);
  }

  process(filter, obj, path = "") {
    const res = {};
    for (let [k, v] of Object.entries(filter)) {
      const p = `${path}.${k}`;
      const func = this.paths[p];
      let o = obj[k];
      func && (o = func(o));
      res[k] = v === 1 ? o ?? null : this.process(v, o, p);
    }
    return res;
  }

  static wrapHeaderProxy(v) {
    return new Proxy(v, {
      get(target, key) {
        return target.get(key) || target[key];
      }
    });
  }

  static parseSearchParams(v) {
    return Object.fromEntries(new URLSearchParams(v).entries());
  }

  static parseCookie(cookieString) {
    return Object.fromEntries(
      cookieString.split(";").map(
        p => p.split(/=(.+)/).map(s => s?.trim())
      )
    );
  }
}