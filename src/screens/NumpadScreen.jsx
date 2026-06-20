import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import styles from './NumpadScreen.module.css'

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','✓']

function formatGap(ms) {
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NumpadScreen() {
  const [amount, setAmount] = useState('0')
  const [type, setType] = useState('Spend')
  const [gapLabel, setGapLabel] = useState(null)
  const navigate = useNavigate()
  const { userEmail } = useAuth()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastEntry_' + (userEmail || 'unknown'))
      if (raw) {
        const { ts } = JSON.parse(raw)
        setGapLabel(formatGap(Date.now() - ts))
      }
    } catch {}
  }, [userEmail])

  const handleKey = useCallback((key) => {
    if (key === '✓') {
      const num = parseFloat(amount)
      if (!num || num <= 0) return
      navigate('/detail', { state: { amount: num, type } })
      return
    }
    setAmount(prev => {
      if (key === '.' && prev.includes('.')) return prev
      if (prev === '0' && key !== '.') return key
      if (prev.length >= 10) return prev
      return prev + key
    })
  }, [amount, type, navigate])

  const handleDelete = useCallback(() => {
    setAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1))
  }, [])

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.toggle}>
          <button className={type === 'Spend' ? styles.activeToggle : styles.inactiveToggle} onClick={() => setType('Spend')}>Spend</button>
          <button className={type === 'Income' ? styles.activeToggle : styles.inactiveToggle} onClick={() => setType('Income')}>Income</button>
        </div>
        <Link to="/settings" className={styles.settingsBtn}>⚙</Link>
      </div>

      <div className={styles.display}>
        <span className={styles.currency}>₹</span>
        <span className={styles.amount}>
          {amount.endsWith('.')
            ? parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + '.'
            : parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
          }
        </span>
      </div>

      {gapLabel && (
        <div className={styles.infoStrip}>
          <span>Last logged: {gapLabel}</span>
        </div>
      )}

      <div className={styles.numpad}>
        {KEYS.map(k => (
          <button
            key={k}
            className={k === '✓' ? styles.confirmKey : styles.key}
            onClick={() => handleKey(k)}
          >
            {k}
          </button>
        ))}
        <button className={styles.deleteKey} onClick={handleDelete}>⌫</button>
      </div>
    </div>
  )
}
