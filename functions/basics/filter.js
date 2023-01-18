const whitelist = {
  request: {
    method: 1,
    url: 1,
    body: 4,
    headers: {
      "cf-connecting-ip": 2,
      "cf-ray": 2,
      cookie: 3,
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

const functions = {
  1: function getValue(parent, key) {
    return parent[key];
  },
  2: function getHeader(parent, key) {
    return parent.get(key);
  },
  3: function getCookieObj(parent, key) {
    const cStr = parent.get(key);
    return cStr ? Object.fromEntries(cStr.split(";").map(s => s.trim()).map(i => i.split("="))) : {};
  },
  4: function getJson(parent, key){
    const value = parent[key];
    return value === undefined ? undefined : JSON.parse(value);
  }
};

(function prepWhitelist(filter, functions) {
  for (let [key, value] of Object.entries(filter))
    value > 0 ? filter[key] = functions[value] : prepWhitelist(value, functions);
})(whitelist, functions);

export function filter(f, obj) {
  const res = {};
  for (let [key, value] of Object.entries(f))
    res[key] = value instanceof Function ? value(obj, key) : filter(value, obj[key]);
  return res;
}

export async function onRequest(context) {
  context.state = filter(whitelist, context);
  return new Response(JSON.stringify(context.state, null, 2));
}