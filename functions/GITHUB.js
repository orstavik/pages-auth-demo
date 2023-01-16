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

  static fetchAccessToken(code, client_id, redirect_uri, client_secret, state) {
    return fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({code, client_id, client_secret, redirect_uri, state})
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