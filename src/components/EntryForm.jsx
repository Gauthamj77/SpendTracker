import { useEffect } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import ChipPicker from './ChipPicker.jsx'
import styles from './EntryForm.module.css'

export default function EntryForm({ values, onChange }) {
  const { categories, paymentMethods, loaded, loadConfig } = useConfig()

  useEffect(() => { if (!loaded) loadConfig() }, [loaded, loadConfig])

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Amount (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={values.amount}
            onChange={e => onChange('amount', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Type</label>
          <div className={styles.toggle}>
            {['Spend','Income'].map(t => (
              <button
                key={t}
                type="button"
                className={values.type === t ? styles.activeToggle : styles.inactiveToggle}
                onClick={() => onChange('type', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Date</label>
          <input
            type="date"
            className={styles.input}
            value={values.date}
            onChange={e => onChange('date', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Time</label>
          <input
            type="time"
            className={styles.input}
            value={values.time}
            onChange={e => onChange('time', e.target.value)}
          />
        </div>
      </div>

      <ChipPicker label="Category" options={categories} value={values.category} onChange={v => onChange('category', v)} />
      <ChipPicker label="Payment Method" options={paymentMethods} value={values.paymentMethod} onChange={v => onChange('paymentMethod', v)} />

      <div className={styles.field}>
        <label className={styles.label}>Notes (optional)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. lunch at office"
          value={values.notes}
          onChange={e => onChange('notes', e.target.value)}
        />
      </div>
    </div>
  )
}
