

//base64url
//EXAMPLE:
//  const b64ulr = toBase64url(btoa(aStr));
//  const str = atob(fromBase64url(b64url));
//ATT!! notice how the  btoa and atob are respectively inside and then outside the base64url functions.
function toBase64url(base64str) {
  return base64str.replaceAll("+", '-').replaceAll("/", '_').replaceAll("=", '');
}

export function fromBase64url(base64urlStr) {
  base64urlStr = base64urlStr.replaceAll("-", '+').replaceAll("_", '/');
  if (base64urlStr.length % 4 === 2)
    base64urlStr += '==';
  else if (base64urlStr.length % 4 === 3)
    base64urlStr += '=';
  return base64urlStr;
}

//base64url ends
//uint8ToHexString, and vice versa
function uint8ToHexString(ar) {
  return Array.from(ar).map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

function hexStringToUint8(str) {
  return new Uint8Array(str.match(/.{2}/g).map(byte => parseInt(byte, 16)));
}

//uint8ToHexString ends

//ENCRYPT & DECRYPT
let key;

async function makeKeyAESGCM(pw, iv) {
  return key ??= await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw)), {
    name: 'AES-GCM',
    iv
  }, false, ['decrypt', 'encrypt']);  // use pw to generate key
}

async function encryptAESGCM(password, iv, plaintext) {
  const key = await makeKeyAESGCM(password, iv);
  const ptUint8 = new TextEncoder().encode(plaintext);                               // encode plaintext as UTF-8
  const ctBuffer = await crypto.subtle.encrypt({name: key.algorithm.name, iv: iv}, key, ptUint8);                   // encrypt plaintext using key
  const ctArray = Array.from(new Uint8Array(ctBuffer));                              // ciphertext as byte array
  return ctArray.map(byte => String.fromCharCode(byte)).join('');             // ciphertext as string
}

async function decryptAESGCM(password, iv, ctStr) {
  const key = await makeKeyAESGCM(password, iv);
  const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0))); // ciphertext as Uint8Array
  const plainBuffer = await crypto.subtle.decrypt({name: key.algorithm.name, iv: iv}, key, ctUint8);                 // decrypt ciphertext using key
  return new TextDecoder().decode(plainBuffer);                                       // return the plaintext
}

//ENCRYPT & DECRYPT end

const SECRET = 'klasjdfoqjpwoekfj!askdfj';
const STATE_SECRET_TTL = 5 * 1000;  //5sec is simpler to test.
const header = {status: 201, headers: {'content-type': 'text/html'}};

export async function onRequest({request: req}) {
  const decrypt = new URL(req.url).searchParams.get("decrypt");
  const now = Date.now();
  if (decrypt) {
    const [ivText, cipherB64url] = decrypt.split('.');
    const iv = hexStringToUint8(ivText);
    const cipher = atob(fromBase64url(cipherB64url));
    const payloadTxt = await decryptAESGCM(SECRET, iv, cipher);
    const obj = JSON.parse(payloadTxt);
    obj["now<iat+ttl"] = now < obj.iat + obj.ttl;
    obj["iat<now"] = obj.iat < now;
    return new Response(JSON.stringify(obj, null, 2), header);
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ivStr = uint8ToHexString(iv);
  const state = JSON.stringify({now, ttl: STATE_SECRET_TTL, ivStr});
  const cipher = await encryptAESGCM(SECRET, iv, state);
  const stateSecret = uint8ToHexString(iv) + '.' + toBase64url(btoa(cipher));
  return new Response(`Here is your 666 stateSecret: ${stateSecret}. <a href='?decrypt=${stateSecret}'>Check secret</a>`, header);
}