//https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
import {base64DecToArr} from "./AES-GCM.js";

function randomString(length) {
  const iv = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

function redirectUrl(path, params) {
  return path + '?' + Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}

async function fetchAccessToken(path, data) {
  return await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: Object.entries(data).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')
  });
}

export class GOOGLE {
  static loginLink(GOOGLE_CODE_LINK, GOOGLE_OAUTH_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, state) {
    return redirectUrl(GOOGLE_OAUTH_LINK, {
      state: state,
      nonce: randomString(12),
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      scope: 'openid email profile',
      response_type: 'code',
    });
  }

  static async getUserData(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, grant_type) {
    const tokenPackage = await fetchAccessToken(
      GOOGLE_CODE_LINK, {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT,
        grant_type: 'authorization_code'
      }
    );

    const jwt = await tokenPackage.json();
    console.log(jwt)
    const [header, payloadB64url, signature] = jwt.id_token.split('.');
    const payloadText = atob(base64DecToArr(payloadB64url));
    const payload = JSON.parse(payloadText);
    return payload;
  }
}