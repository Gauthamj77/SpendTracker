import { useEffect, useState, useRef, useMemo } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import ChipPicker from './ChipPicker.jsx'
import styles from './EntryForm.module.css'

export default function EntryForm({ values, onChange, pastNotes = [] }) {
  const { categories, paymentMethods, loaded, loadConfig } = useConfig()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const notesRef = useRef(null)

  useEffect(() => { if (!loaded) loadConfig() }, [loaded, loadConfig])

  // Dynamically calculate suggestions based on notes input, amount, and category
  const suggestions = useMemo(() => {
    const val = values.notes || ''
    if (val.trim().length === 0 || pastNotes.length === 0) return []

    const q = val.trim().toLowerCase()
    const enteredAmount = parseFloat(values.amount || 0)
    const currentCategory = values.category || ''

    // 1. Group past entries by note text
    const groups = {}
    pastNotes.forEach(item => {
      // Normalize pastNotes if they are strings (backward compatibility check)
      const noteText = typeof item === 'string' ? item.trim() : (item.notes || '').trim()
      const noteAmount = typeof item === 'string' ? 0 : parseFloat(item.amount || 0)
      const noteCategory = typeof item === 'string' ? '' : item.category || ''
      
      const noteLower = noteText.toLowerCase()
      
      // Match check: must contain search query and not be identical
      if (noteLower.includes(q) && noteLower !== q) {
        if (!groups[noteText]) {
          groups[noteText] = {
            text: noteText,
            instances: []
          }
        }
        groups[noteText].instances.push({ amount: noteAmount, category: noteCategory })
      }
    })

    // 2. Score each group
    const candidates = Object.values(groups).map(g => {
      let score = g.instances.length // Base score: frequency
      
      // Exact amount match check (highest priority)
      const hasAmountMatch = g.instances.some(inst => Math.abs(inst.amount - enteredAmount) < 0.01)
      if (hasAmountMatch && enteredAmount > 0) {
        score += 1000
      }
      
      // Category match check
      const hasCategoryMatch = g.instances.some(inst => inst.category === currentCategory)
      if (hasCategoryMatch && currentCategory) {
        score += 100
      }

      // Starts-with prefix boost
      if (g.text.toLowerCase().startsWith(q)) {
        score += 10
      }

      return { text: g.text, score }
    })

    // 3. Sort by score desc, then alphabetically
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.text.localeCompare(b.text)
    })

    return candidates.map(c => c.text).slice(0, 5)
  }, [values.notes, values.amount, values.category, pastNotes])

  const handleNotesChange = (val) => {
    onChange('notes', val)
    setShowSuggestions(val.trim().length > 0)
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
        {showSuggestions && suggestions.length > 0 && (
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
