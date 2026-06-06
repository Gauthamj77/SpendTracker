const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let _tokenClient = null
let _accessToken = null

export function getAccessToken() {
  return _accessToken
}

export function setAccessToken(token) {
  _accessToken = token
}

export function clearAccessToken() {
  _accessToken = null
}

export function initTokenClient(onTokenResponse) {
  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets email profile',
    callback: (response) => {
      if (response.error) {
        onTokenResponse(null, response.error)
        return
      }
      setAccessToken(response.access_token)
      onTokenResponse(response.access_token, null)
    }
  })
  return _tokenClient
}

export function requestToken(prompt = '') {
  if (!_tokenClient) {
    if (prompt === 'none') return  // silent refresh - fail quietly
    throw new Error('Google Sign-In could not load. Please disable any ad blockers and try again, or use a different browser.')
  }
  _tokenClient.requestAccessToken({ prompt })
}

export function signOut() {
  if (_accessToken) {
    google.accounts.oauth2.revoke(_accessToken, () => {})
  }
  clearAccessToken()
}
