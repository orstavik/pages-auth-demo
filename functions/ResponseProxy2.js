function getProp(obj, path) {
  for (let i = 0; obj && i < path.length; i++)
    obj = obj[path[i]];
  return obj;
}

function getPropFill(obj, path) {
  for (let p of path)
    obj = obj[p] ??= {};
  return obj;
}

function normalizeFilter2(filter, functions) {
  const res = {};
  const values = new Map();
  for (let [k, v] of Object.entries(filter)) {
    const resPath = k.split(".");
    const obj = getPropFill(res, resPath);
    values.set(obj, v.split("."));
  }
  const funcs = new Map();
  for (let [k, v] of Object.entries(functions)) {
    const resPath = k.split(".");
    const obj = getPropFill(res, resPath);
    funcs.set(obj, v);
  }
  return {res, funcs, values};
}

function getValues2(parent, key, filter, state, funcs, values) {
  const awaits = [];
  const vPth = values.get(filter);
  let res = vPth ? getProp(state, vPth) ?? {} : {}; //todo we need to clone the output of getProp here? I think yes..
  for (let [k, v] of Object.entries(filter))
    awaits.push(getValues2(res, k, v, state, funcs, values));
  const func = funcs.get(filter);
  if (awaits.length)
    return Promise.all(awaits).then(_ => func ? func(res) : res).then(r => parent[key] = r);
  func && (res = func(res));
  if (res instanceof Promise)
    return res.then(r => parent[key] = r);
  parent[key] = res;
}

function cleanEmptyBranches(obj) {
  for (let [key, val] of Object.entries(obj)) {
    if (val instanceof Object) {
      cleanEmptyBranches(obj[key]);
      if (!Object.keys(val).length)
        delete obj[key];
    } else if (val === undefined /*|| val === null*/)
      delete obj[key];
  }
  return obj;
}

export function reverseFilter(filter, functions, state) {
  const {res: tree, funcs, values} = normalizeFilter2(filter, functions);
  let res = getValues2({}, '_', tree, state, funcs, values);
  return res instanceof Promise ? res.then(r => cleanEmptyBranches(r)) : cleanEmptyBranches(r);
}