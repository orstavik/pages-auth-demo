//todo
import {base64EncArr} from "./AES-GCM";

export class GOOGLE {
  static loginLink(GOOGLE_OAUTH_LINK, GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, state) {
    const url = new URL(GOOGLE_OAUTH_LINK);
    url.search = new URLSearchParams({
      state: state,
      nonce: base64EncArr(crypto.getRandomValues(new Uint8Array(12))),
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      scope: 'openid email profile',
      response_type: 'code'
    });
    return url.href;
  }
  static async getUserData(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET, grant_type) {
    const tokenPackage = await fetch(GOOGLE_CODE_LINK, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT,
        grant_type: 'authorization_code'
      })
    });
    const jwt = await tokenPackage.json();
    const jsonPayload = GOOGLE.decodeJwtPayload(jwt);
    return JSON.parse(jsonPayload);
  }

  static decodeJwtPayload(jwt) {
    const base64Url = jwt.id_token.split('.')[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    return decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }
}