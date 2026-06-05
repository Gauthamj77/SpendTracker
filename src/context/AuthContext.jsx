import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
        initTokenClient(onTokenResponse)
        requestToken('none')
      }
    }, 100)
    return () => clearInterval(interval)
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

function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
