const secretKeys = {};

function hashKey256(secret) {
  const cache = secretKeys[secret];
  if (cache)
    return cache;
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))
    .then(keyData => crypto.subtle.importKey("raw", keyData, "AES-GCM", true, ["encrypt", "decrypt"]))
    .then(key => secretKeys[secret] = key);
}

export async function encode(message, key) {
  key = hashKey256(key);
  if (key instanceof Promise)
    key = await key;
  const uint8Array = new TextEncoder().encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, uint8Array);
  return base64EncArr(iv) + "." + base64EncArr(new Uint8Array(cipher));
}

export async function decode(cipherText, key) {
  key = hashKey256(key);
  if (key instanceof Promise)
    key = await key;
  const [iv, cipher] = cipherText.split(".").map(base64DecToArr);
  const payload = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, cipher);
  return new TextDecoder().decode(payload);
}

export class Base64Token {
  static async encode(key, dict = {}) {
    key = hashKey256(key);
    if (key instanceof Promise)
      key = await key;
    dict.iat = new Date().getTime();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    dict.iv64 = base64EncArr(iv);
    dict.ttl ??= 10;
    const ab = new TextEncoder().encode(JSON.stringify(dict));
    const cipher = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, ab);
    return dict.iv64 + "." + base64EncArr(new Uint8Array(cipher));
  }

  static async decode(key, cipherText) {
    try {
      key = hashKey256(key);
      if (key instanceof Promise)
        key = await key;
      if (!cipherText)
        throw "bad cipherText.";
      const [iv64, cipher64, err] = cipherText.split(".");
      if (!iv64 || !cipher64 || err)
        throw "bad cipherText.";
      const uint8Array = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: base64DecToArr(iv64)
      }, key, base64DecToArr(cipher64));
      const obj = JSON.parse(new TextDecoder().decode(uint8Array));
      if (obj.iv64 !== iv64)
        throw "bad iv.";
      const now = new Date().getTime();
      const age = Math.floor((now - obj.iat) / 1000);
      if (age < 0 || age > obj.ttl)
        throw `bad ttl. ttl=${obj.ttl} now=${now} iat=${obj.iat} age=${age}`;
      return obj;
    } catch (err) {
      return null;//how do we want this to work?..
    }
  }

  static #c = {};

  static makeCachingDecoder(key, maxCacheEntries = 1000) {
    return function (cipherText) {
      return Base64Token.#c[cipherText] ??
        Base64Token.decode(key, cipherText).then(obj => {
          const keys = Object.keys(Base64Token.#c);//todo untested
          if (keys.length > maxCacheEntries)       //todo untested
            for (let i = 0; i < 10; i++)           //todo untested
              delete Base64Token.#c[keys[i]];      //todo untested
          return Base64Token.#c[cipherText] = deepFreeze(obj);
        });
    }
  }
}

function deepFreeze(obj) {
  for (let v of Object.values(obj))
    v instanceof Object && deepFreeze(v);
  return Object.freeze(obj);
}

// Unfortunately, atob/btoa in js doesn't work properly. So we need this method for converting between base64 and numbers/arrayBuffers. See:
// https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_%E2%80%93_rewriting_atob_and_btoa_using_typedarrays_and_utf-8

function b64ToUint6(nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
}

export function base64DecToArr(sBase64) {
  const l = sBase64.length;
  sBase64 = sBase64.substring(0, l - (sBase64[l - 2] === "=" ? 2 : sBase64[l - 1] === "=" ? 1 : 0))
  const taBytes = new Uint8Array((sBase64.length * 3 + 1) >> 2);
  let nMod3, nMod4, nUint24 = 0, nOutIdx = 0;
  for (let nInIdx = 0; nInIdx < sBase64.length; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sBase64.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
    if (nMod4 === 3 || sBase64.length - nInIdx === 1) {
      nMod3 = 0;
      while (nMod3 < 3 && nOutIdx < (sBase64.length * 3 + 1) >> 2) {
        taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
        nMod3++;
        nOutIdx++;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}

/* Base64 string to array encoding */
function uint6ToB64(nUint6) {
  return nUint6 < 26 ? nUint6 + 65 : nUint6 < 52 ? nUint6 + 71 : nUint6 < 62 ? nUint6 - 4 : nUint6 === 62 ? 43 : nUint6 === 63 ? 47 : 65;
}

export function base64EncArr(aBytes) {
  let nMod3 = 2, sB64Enc = "", nUint24 = 0;
  const nLen = aBytes.length;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
    if (nMod3 === 2 || nLen - nIdx === 1) {
      sB64Enc += String.fromCodePoint(
        uint6ToB64((nUint24 >>> 18) & 63),
        uint6ToB64((nUint24 >>> 12) & 63),
        uint6ToB64((nUint24 >>> 6) & 63),
        uint6ToB64(nUint24 & 63)
      );
      nUint24 = 0;
    }
  }
  return sB64Enc.substring(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? "" : nMod3 === 1 ? "=" : "==");
}