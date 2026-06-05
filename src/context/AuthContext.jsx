import { createContext, useState, useEffect, useCallback } from 'react'
import { initTokenClient, requestToken, signOut as authSignOut } from '../lib/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [sheetId, setSheetIdState] = useState(() => localStorage.getItem('sheetId') || '')
  const [loading, setLoading] = useState(true)

  const onTokenResponse = useCallback((token, error) => {
    if (!error && token) setAccessToken(token)
    setLoading(false)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval)
        clearTimeout(timeout)
        initTokenClient(onTokenResponse)
        requestToken('none')
      }
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setLoading(false)
    }, 10000)
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
    <AuthContext.Provider value={{ accessToken, sheetId, loading, signIn, signOut, saveSheetId }}>
      {children}
    </AuthContext.Provider>
  )
}
