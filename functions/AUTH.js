import {base64EncArr} from "./AES-GCM";

export function bakeCookie(name, value, domain, ttl) {
  return `${name}=${value}; Domain=${domain}; SameSite=LAX; Max-Age=${ttl}; path=/; secure; httpOnly`;
}

//https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
export class GITHUB {

  static loginLink(GITHUB_REDIRECT, GITHUB_CLIENT_ID, state) {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", GITHUB_CLIENT_ID);
    url.searchParams.set("redirect_uri", GITHUB_REDIRECT);
    url.searchParams.set("scope", "user");
    url.searchParams.set("state", state);
    // url.searchParams.set("login", previous username);
    // url.searchParams.set("allow_signup", true); true by default
    return url.href;
  }

  static fetchAccessToken(code, client_id, redirect_uri, client_secret) {
    return fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({code, client_id, client_secret, redirect_uri})
    });
  }

  static fetchUserData(accessToken) {
    return fetch('https://api.github.com/user', {
      headers: {
        'Authorization': 'token ' + accessToken,
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }
}

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
  static async getUserData(code, GOOGLE_CODE_LINK, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT, GOOGLE_CLIENT_SECRET) {
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
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }
}