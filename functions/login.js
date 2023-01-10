function randomString(length) {
  const iv = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

function githubLoginLink({GITHUB_REDIRECT, GITHUB_CLIENT_ID}, state) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", GITHUB_REDIRECT);
  url.searchParams.set("scope", "user");
  url.searchParams.set("state", state);
  // url.searchParams.set("login", previous username);
  // url.searchParams.set("allow_signup", true); true by default
  return url.href;
}

//https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity

export async function onRequest({request, env}) {
  const state = randomString(12);
  //todo the state can be added to a KV, so that the callback can be checked for fakes.
  const href = githubLoginLink(env, state);
  return new Response(`<a href="${href}">login here</a>`, {
    status: 200,
    headers: {
      "content-type": "text/html"
    }
  });
  // return Response.redirect(href);
}