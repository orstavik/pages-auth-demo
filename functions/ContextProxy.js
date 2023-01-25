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
      res[k] = (v !== 1 && o ? this.process(v, o, p) : o) ?? null;
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

  static parseCookie(cStr) {
    return cStr ?
      Object.fromEntries(cStr.split(";").map(p => p.split(/=(.+)/).map(s => s?.trim()))) :
      null;
  }
}