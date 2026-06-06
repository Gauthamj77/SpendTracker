import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { initTokenClient, requestToken, signOut as authSignOut } from '../lib/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [sheetId, setSheetIdState] = useState('102DPBAyklQVt_YGNacO0LTC9iE88AxK-xxqvIjyq3js')
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)

  const onTokenResponse = useCallback(async (token, error) => {
    if (!error && token) {
      setAccessToken(token)
      // Fetch user email from Google userinfo
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const info = await res.json()
          setUserEmail(info.email || '')
        }
      } catch {
        // non-fatal, email stays empty
      }
      // Schedule token refresh before it expires (tokens last 3600s, refresh at 3300s)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        requestToken('none')
      }, 3300 * 1000)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval)
        clearTimeout(timeout)
        initTokenClient(onTokenResponse)
        // Attempt silent sign-in - if user has previously granted consent,
        // this succeeds without any popup and skips the sign-in screen
        requestToken('none')
      }
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setLoading(false)
    }, 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [onTokenResponse])

  const signIn = useCallback(() => {
    requestToken('')
  }, [])

  const signOut = useCallback(() => {
    authSignOut()
    setAccessToken(null)
    setUserEmail('')
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }, [])

  const saveSheetId = useCallback((id) => {
    localStorage.setItem('sheetId', id)
    setSheetIdState(id)
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, sheetId, loading, userEmail, signIn, signOut, saveSheetId }}>
      {children}
    </AuthContext.Provider>
  )
}
