//https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity

function randomString(length) {
  const iv = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

export class GOOGLE {

  static loginLink(GOOGLE_REDIRECT, GOOGLE_CLIENT_ID, state) {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", GOOGLE_REDIRECT);
    url.searchParams.set("scope", "openid email");
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", randomString(12));
    url.searchParams.set("response_type", 'code');
    return url.href;
  }

  static fetchAccessToken(code, client_id, redirect_uri, client_secret, grant_type, state) {
    return fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'},
      body: JSON.stringify({code, client_id, client_secret, redirect_uri, grant_type, state})
    });
  }

  // static fetchUserData(accessToken) {
  //   return fetch('https://api.github.com/user', {
  //     headers: {
  //       'Authorization': 'token ' + accessToken,
  //       'User-Agent': 'Mozilla/5.0',
  //       'Accept': 'application/vnd.github.v3+json'
  //     }
  //   });
  // }
}