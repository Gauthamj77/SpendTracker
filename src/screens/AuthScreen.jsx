import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const { signIn } = useAuth()
  const [signInError, setSignInError] = useState('')

  const handleSignIn = () => {
    try {
      signIn()
      setSignInError('')
    } catch (e) {
      setSignInError(e.message)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>Spend Tracker</h1>
        <p className={styles.sub}>Shared tracking for two people</p>
        <button className={styles.signInBtn} onClick={handleSignIn}>
          Sign in with Google
        </button>
        {signInError && <p style={{ color: 'red', marginTop: 12, fontSize: '0.85rem' }}>{signInError}</p>}
      </div>
    </div>
  )
}
