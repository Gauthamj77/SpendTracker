import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const { signIn, sheetId, saveSheetId } = useAuth()
  const [inputId, setInputId] = useState(sheetId)

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>Spend Tracker</h1>
        <p className={styles.sub}>Shared tracking for two people</p>

        {!sheetId && (
          <div className={styles.field}>
            <label className={styles.label}>Google Sheet ID</label>
            <input
              className={styles.input}
              placeholder="Paste your Sheet ID"
              value={inputId}
              onChange={e => setInputId(e.target.value)}
            />
            <p className={styles.hint}>
              Found in the Google Sheets URL:<br />
              docs.google.com/spreadsheets/d/<strong>[SHEET ID]</strong>/edit
            </p>
            <button
              className={styles.saveBtn}
              onClick={() => saveSheetId(inputId.trim())}
              disabled={!inputId.trim()}
            >
              Save Sheet ID
            </button>
          </div>
        )}

        {sheetId && (
          <button className={styles.signInBtn} onClick={signIn}>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  )
}
