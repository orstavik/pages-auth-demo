async function fetchTokenGITHUB(code, client_id, redirect_uri, client_secret, state) {
  const data = {code, client_id, client_secret, redirect_uri, state};
  const dataString = Object.entries(data).map(([k, v])=>k +'='+encodeURIComponent(v)).join('&');

  const fromGITHUB = await fetch('https://github.com/login/oauth/access_token',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: dataString
  });
  return fromGITHUB.json();
}

export async function onRequest({request, env: {GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET}}){
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  // if(states.indexOf(state) === -1) //todo how to cache the state?
  //   return new Response('state is lost');
  const data = await fetchTokenGITHUB(code, GITHUB_CLIENT_ID, GITHUB_REDIRECT, GITHUB_CLIENT_SECRET, state);
  const accessToken = data['access_token'];
  const user = await fetch('https://api.github.com/user', {
    status: 201,
    headers: {
      'Authorization': 'token ' + accessToken,
      'User-Agent': 'Mozilla/5.0', //for some reason, this must be added.
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const userText = await user.text();
  return new Response(userText, {status: 201});
}