//Made this method because I assume that Promise.all(arr) don't allow for adding
//new Promises to the input array after it has been called.
//If this is wrong, this is unnecessary, then we can just remove it.
async function Promise_AllDynamic(ps) {
  for (let i = 0; i < ps.length;) {
    i = ps.length;
    await Promise.all(ps);
  }
}

export class ContextProxy {
  constructor(specialGetters) {
    this.specialGetters = specialGetters;
  }

  filter(filter, obj) {
    const awaits = [];
    const res = this.#filterImpl(filter, obj, "", awaits);
    return awaits.length ? Promise_AllDynamic(awaits).then(_ => res) : res;
  }

  #filterImpl(filter, obj, path = "", awaits) {
    obj ??= {};
    const res = {};
    for (let [k, v] of Object.entries(filter)) {
      const p = `${path}.${k}`;
      const func = this.specialGetters[p];
      const o = func ? func(obj[k]) : obj[k];
      if (o instanceof Promise) {
        awaits.push(o);
        o.then(o => res[k] = v === 1 ? o ?? null : this.#filterImpl(v, o, p, awaits));
      } else
        res[k] = v === 1 ? o ?? null : this.#filterImpl(v, o, p, awaits);
    }
    return res;
  }

  static extract(filter, obj) {
    const res = {};
    for (let [k, v] of Object.entries(filter)) {
      if (v instanceof String || typeof v === "string") {
        const path = v.split(".");
        const prop = path.pop();
        let o = obj;
        for (let p of path) {
          if (o === null)
            break;
          o = o[p];
        }
        if (o instanceof Object) {
          res[k] = o[prop];
          delete o[prop];
        } else {
          res[k] = null;
        }
      } else if (v instanceof Object) {
        res[k] = this.extract(filter[k], obj);
      } else {
        res[k] = null;
      }
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

  static parseUrl(str) {
    return new URL(str);
  }
}