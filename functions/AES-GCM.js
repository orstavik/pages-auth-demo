export async function hashKey256(secret) {
  const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", keyData, "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function encode(message, key) {
  const uint8Array = new TextEncoder().encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, uint8Array);
  return base64EncArr(iv) + "." + base64EncArr(new Uint8Array(cipher));
}

export async function decode(cipherText, key) {
  const [iv, cipher] = cipherText.split(".").map(base64DecToArr);
  const payload = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, cipher);
  return new TextDecoder().decode(payload);
}

export async function encodebase64Token(key, dict = {}) {
  dict.iat = new Date().getTime();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  dict.iv64 = base64EncArr(iv);
  const ab = new TextEncoder().encode(JSON.stringify(dict));
  const cipher = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, ab);
  return dict.iv64 + "." + base64EncArr(new Uint8Array(cipher));
}

export async function decodeBase64Token(cipherText, key, ttl) {
  const [iv64, cipher64] = cipherText.split(".");
  const uint8Array = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: base64DecToArr(iv64)
  }, key, base64DecToArr(cipher64));
  const obj = JSON.parse(new TextDecoder().decode(uint8Array));
  if (obj.iv64 !== iv64)
    throw "wrong iv.";
  const now = new Date().getTime();
  const age = now - obj.iat;
  if (age < 0 || age > ttl)
    throw `Outside TTL; ttl=${ttl} now=${now} iat=${obj.iat} age=${age}`;
  return obj;
}

// Unfortunately, atob/btoa in js doesn't work properly. So we need this method for converting between base64 and numbers/arrayBuffers. See:
// https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_%E2%80%93_rewriting_atob_and_btoa_using_typedarrays_and_utf-8

function b64ToUint6(nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
}

function base64DecToArr(sBase64) {
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

function base64EncArr(aBytes) {
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