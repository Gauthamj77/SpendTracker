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
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (response) => {
      if (response.error) return
      setAccessToken(response.access_token)
      onTokenResponse(response.access_token)
    }
  })
  return _tokenClient
}

export function requestToken(prompt = '') {
  if (!_tokenClient) throw new Error('Token client not initialized')
  _tokenClient.requestAccessToken({ prompt })
}

export function signOut() {
  if (_accessToken) {
    google.accounts.oauth2.revoke(_accessToken, () => {})
  }
  clearAccessToken()
}
