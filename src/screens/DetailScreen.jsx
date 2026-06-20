import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EntryForm from '../components/EntryForm.jsx'
import Toast from '../components/Toast.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useSheets } from '../hooks/useSheets.js'
import { useAuth } from '../hooks/useAuth.js'
import { toISOLocal } from '../lib/utils.js'
import styles from './DetailScreen.module.css'

function getNow() {
  const now = new Date()
  return {
    date: toISOLocal(now).slice(0, 10),
    time: now.toTimeString().slice(0, 5)
  }
}

export default function DetailScreen() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { addEntry, fetchAll, loading } = useSheets()
  const { userEmail } = useAuth()
  const { date, time } = getNow()

  const [values, setValues] = useState({
    amount: state?.amount ?? '',
    type: state?.type ?? 'Spend',
    date,
    time,
    category: '',
    paymentMethod: 'UPI',
    notes: ''
  })
  const [toast, setToast] = useState(null)
  const [dupConfirm, setDupConfirm] = useState(false)
  const [pastNotes, setPastNotes] = useState([])

  useEffect(() => {
    fetchAll().then(entries => {
      const notes = entries
        .map(e => (e.Notes || '').trim())
        .filter(n => n.length > 0)
      setPastNotes([...new Set(notes)])
    }).catch(() => {})
  }, [])

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (force = false) => {
    if (!values.category || !values.paymentMethod) {
      setToast({ message: 'Select category and payment method', type: 'error' })
      return
    }
    // Duplicate detection - same amount + category within 2 minutes
    if (!force) {
      try {
        const raw = localStorage.getItem('lastEntry_' + (userEmail || 'unknown'))
        if (raw) {
          const last = JSON.parse(raw)
          const sameAmount = String(last.amount) === String(values.amount)
          const sameCategory = last.category === values.category
          const within2Min = (Date.now() - last.ts) < 2 * 60 * 1000
          if (sameAmount && sameCategory && within2Min) {
            setDupConfirm(true)
            return
          }
        }
      } catch {}
    }
    try {
      const timestamp = `${values.date}T${values.time}:00`
      await addEntry({
        amount: values.amount,
        type: values.type,
        category: values.category,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        timestamp
      })
      setToast({ message: 'Saved!', type: 'success' })
      setTimeout(() => navigate('/'), 800)
    } catch {
      setToast({ message: 'Failed to save. Try again.', type: 'error' })
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>Back</button>
        <h2 className={styles.title}>New Entry</h2>
      </div>

      <div className={styles.body}>
        <EntryForm values={values} onChange={handleChange} pastNotes={pastNotes} />
      </div>

      <div className={styles.footer}>
        <button className={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {dupConfirm && (
        <ConfirmDialog
          message={`You just added ₹${values.amount} to ${values.category}. Add again?`}
          onConfirm={() => { setDupConfirm(false); handleSubmit(true) }}
          onCancel={() => setDupConfirm(false)}
        />
      )}
    </div>
  )
}
