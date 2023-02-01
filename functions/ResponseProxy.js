
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

function getParents(obj, path) {
  return path.map(p => obj = obj[p]);
}

export function getValues(filter, state) {
  const res = {};
  //normalize the sortedFilters
  const sortedFilters = Object.entries(filter)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([k, v]) => {
      const resPath = k.split(".");
      const prop = resPath.pop();
      return [[resPath, prop], v instanceof Array ? [v[0].split("."), v[1]] : v instanceof Function ? [, v] : [v.split(".")]];
    });

  const awaits = [];
  const awaitsMap = new Map();
  //this is the task that we need to do when we produce the output. doesn't handle await yet.
  for (let [[parentPath, prop], [stateP, process]] of sortedFilters) {
    let val = stateP && getProp(state, stateP);//1. get the value.
    const obj = getPropFill(res, parentPath);
    val ??= obj[prop];
    if (process) {
      const list = awaitsMap.get(obj[prop]);
      if (list) {
        /*val =*/
        Promise.all(list).then(_ => process(val)).then(v => /*v !== undefined && v !== null &&*/ (obj[prop] = v));
        awaits.push(val);
        continue;
      }
      val = process(val);
    }
    obj[prop] = val;
    if (val instanceof Promise) {
      awaits.push(val), val.then(v => obj[prop] = v);

      //todo adding the promise under each parent
      for (let parent of getParents(res, parentPath)) {
        let list = awaitsMap.get(parent);
        !list && awaitsMap.set(parent, list = []);
        list.push(val);
      }

    }
  }
  return awaits.length ? Promise.all(awaits).then(_ => res) : res;
}