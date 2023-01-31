function makePaths(child, specialGetters) {
  return child.split(".").map((prop, i, ar) => {
    const path = ar.slice(0, i + 1).join(".");
    const sGetter = specialGetters[path];
    return {prop, path, sGetter};
  });
}

function specialGetterChain(paths, context, dict, i = 0) {
  let obj = context;
  for (; obj && i < paths.length; i++) {
    const {prop, path, sGetter} = paths[i];
    obj = path in dict ? dict[path] : dict[path] = sGetter ? sGetter(obj[prop]) : obj[prop];
    if (obj instanceof Promise)
      return obj.then(obj => (dict[path] = obj, specialGetterChain(paths, context, dict, i++)));
  }
  return obj;
}

function convertGetters(filter, specialGetters) {
  return Object.fromEntries(Object.entries(filter).map(([k, v]) =>
    [k,
      v instanceof String || typeof v === "string" ?
        specialGetterChain.bind(null, makePaths(v, specialGetters)) :
        convertGetters(v, specialGetters)
    ]));
}

export class ContextProxy2 {
  #filter;

  constructor(specialGetters, filter) {
    this.#filter = convertGetters(filter, specialGetters);
  }

  filter(root) {
    const awaits = [];
    const res = this.#filterImpl(this.#filter, root, awaits);
    return awaits.length ? Promise.all(awaits).then(_ => res) : res;
  }

  #filterImpl(filter, obj, awaits, dict = {}) {
    const res = {};
    for (let [k, v] of Object.entries(filter)) {
      if (v instanceof Function) {
        res[k] = v(obj, dict);
        if (res[k] instanceof Promise)
          awaits.push(res[k]), res[k].then(v => res[k] = v);
      } else
        res[k] = this.#filterImpl(v, obj, awaits, dict);
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

  static async sleeper(obj) {
    await new Promise(r => setTimeout(r, 20));
    return obj;
  }
}