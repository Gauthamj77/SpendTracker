import { useEffect, useState, useRef } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import ChipPicker from './ChipPicker.jsx'
import styles from './EntryForm.module.css'

export default function EntryForm({ values, onChange, pastNotes = [] }) {
  const { categories, paymentMethods, loaded, loadConfig } = useConfig()
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const notesRef = useRef(null)

  useEffect(() => { if (!loaded) loadConfig() }, [loaded, loadConfig])

  const handleNotesChange = (val) => {
    onChange('notes', val)
    if (val.trim().length > 0 && pastNotes.length > 0) {
      const q = val.toLowerCase()
      const filtered = [...new Set(pastNotes)]
        .filter(n => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
        .slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const pickSuggestion = (note) => {
    onChange('notes', note)
    setShowSuggestions(false)
    notesRef.current?.blur()
  }

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

      <div className={styles.field} style={{ position: 'relative' }}>
        <label className={styles.label}>Notes (optional)</label>
        <input
          ref={notesRef}
          type="text"
          className={styles.input}
          placeholder="e.g. lunch at office"
          value={values.notes}
          onChange={e => handleNotesChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && (
          <div className={styles.suggestions}>
            {suggestions.map(note => (
              <button
                key={note}
                type="button"
                className={styles.suggestionItem}
                onMouseDown={() => pickSuggestion(note)}
              >
                {note}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
