import { createContext, useState, useEffect, useCallback } from 'react'
import { initTokenClient, requestToken, signOut as authSignOut } from '../lib/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [sheetId, setSheetIdState] = useState(() => localStorage.getItem('sheetId') || '')
  const [loading, setLoading] = useState(true)

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
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval)
        initTokenClient(onTokenResponse)
        setLoading(false)
      }
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setLoading(false)
    }, 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [onTokenResponse])

  const signIn = useCallback(() => {
    requestToken('')
  }, [])

  const signOut = useCallback(() => {
    authSignOut()
    setAccessToken(null)
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
