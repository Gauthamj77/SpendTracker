import { useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EntryForm from '../components/EntryForm.jsx'
import Toast from '../components/Toast.jsx'
import { useSheets } from '../hooks/useSheets.js'
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
  const { addEntry, loading } = useSheets()
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

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async () => {
    if (!values.category || !values.paymentMethod) {
      setToast({ message: 'Select category and payment method', type: 'error' })
      return
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
        <EntryForm values={values} onChange={handleChange} />
      </div>

      <div className={styles.footer}>
        <button className={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
