//Made this method because I assume that Promise.all(arr) don't allow for adding
//new Promises to the input array after it has been called.
//If this is wrong, this is unnecessary, then we can just remove it.
async function Promise_AllDynamic(ps) {
  const length = ps.length;
  await Promise.all(ps);
  if (length > ps.length)
    await Promise_AllDynamic(ps);
}

export class ContextProxy {
  constructor(...paths) {
    this.paths = Object.assign({}, ...paths);
  }

  superFilter(filter, obj) {
    const promises = [];
    const res = this.filter(filter, obj, "", promises);
    return promises.length ? Promise_AllDynamic(promises).then(_ => res) : res;
  }


  filter(filter, obj, path = "", promises) {
    const res = {};
    for (let [k, v] of Object.entries(filter)) {
      const p = `${path}.${k}`;
      const func = this.paths[p];
      let o = obj[k];
      func && (o = func(o));
      if (o instanceof Promise) {
        promises.push(o);
        o.then(o =>
          res[k] = (!(v !== 1 && o) ? o : this.filter(v, o, p, promises)) ?? null
        );
      } else
        res[k] = (!(v !== 1 && o) ? o : this.filter(v, o, p, promises)) ?? null;
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