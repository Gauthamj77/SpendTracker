import { useState, useEffect, useMemo } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { useSheets } from '../hooks/useSheets.js'
import { getDateRange, formatAmount } from '../lib/utils.js'
import { Link } from 'react-router-dom'
import Toast from '../components/Toast.jsx'
import styles from './BudgetScreen.module.css'

const PEOPLE = [
  { value: 'gautham', label: 'Gautham', initial: 'G' },
  { value: 'maria', label: 'Maria', initial: 'M' },
  { value: 'combined', label: 'Combined' }
]

function ProgressBar({ percent }) {
  const clamped = Math.min(percent, 100)
  const color = percent >= 100 ? '#dc2626' : percent >= 75 ? '#d97706' : '#16a34a'
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${clamped}%`, background: color }} />
    </div>
  )
}

export default function BudgetScreen() {
  const { categories, gauthamBudgets, mariaBudgets, saveGauthamBudgets, saveMariaBudgets, loaded, loadConfig } = useConfig()
  const { fetchAll } = useSheets()
  const [person, setPerson] = useState('gautham')
  const [allEntries, setAllEntries] = useState([])
  const [editing, setEditing] = useState(null) // { category, value }
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loaded) loadConfig()
    fetchAll().then(setAllEntries).catch(() => {})
  }, [])

  const { dateFrom, dateTo } = getDateRange('thisMonth')

  // Spend per category this month for each person
  const spendByCategory = useMemo(() => {
    const thisMonth = allEntries.filter(e =>
      e.Type === 'Spend' &&
      e.Timestamp >= dateFrom &&
      e.Timestamp <= dateTo + 'T23:59:59'
    )
    const gautham = {}, maria = {}, combined = {}
    thisMonth.forEach(e => {
      const amt = parseFloat(e.Amount || 0)
      const isG = e.AddedBy?.toLowerCase().startsWith('g')
      if (isG) gautham[e.Category] = (gautham[e.Category] || 0) + amt
      else maria[e.Category] = (maria[e.Category] || 0) + amt
      combined[e.Category] = (combined[e.Category] || 0) + amt
    })
    return { gautham, maria, combined }
  }, [allEntries, dateFrom, dateTo])

  const budgets = person === 'gautham' ? gauthamBudgets
    : person === 'maria' ? mariaBudgets
    : Object.fromEntries(categories.map(c => [c, (gauthamBudgets[c] || 0) + (mariaBudgets[c] || 0)]))

  const spends = spendByCategory[person] || {}

  const totalBudget = categories.reduce((s, c) => s + (budgets[c] || 0), 0)
  const totalSpend = categories.reduce((s, c) => s + (spends[c] || 0), 0)
  const totalRemaining = totalBudget - totalSpend

  const startEdit = (category) => {
    const currentBudget = person === 'combined'
      ? (gauthamBudgets[category] || 0) + (mariaBudgets[category] || 0)
      : budgets[category] || 0
    setEditing({ category, value: currentBudget > 0 ? String(currentBudget) : '' })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const amount = parseFloat(editing.value) || 0
      if (person === 'gautham') {
        const updated = { ...gauthamBudgets, [editing.category]: amount }
        await saveGauthamBudgets(updated)
      } else if (person === 'maria') {
        const updated = { ...mariaBudgets, [editing.category]: amount }
        await saveMariaBudgets(updated)
      }
      setEditing(null)
      setToast({ message: 'Budget saved', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Budget</h2>
        <Link to="/settings" className={styles.settings}>&#9881;</Link>
      </div>

      <div className={styles.personFilter}>
        {PEOPLE.map(p => (
          <button
            key={p.value}
            className={person === p.value ? styles.activeFilter : styles.filter}
            onClick={() => setPerson(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Budget</span>
            <span className={styles.summaryValue}>₹{formatAmount(totalBudget)}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Spent</span>
            <span className={styles.summaryValueSpend}>₹{formatAmount(totalSpend)}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Remaining</span>
            <span className={totalRemaining < 0 ? styles.summaryValueOver : styles.summaryValueOk}>
              {totalRemaining < 0 ? '-' : ''}₹{formatAmount(Math.abs(totalRemaining))}
            </span>
          </div>
        </div>

        {/* Per category */}
        {categories.map(category => {
          const budget = budgets[category] || 0
          const spend = spends[category] || 0
          const percent = budget > 0 ? Math.round((spend / budget) * 100) : 0
          const remaining = budget - spend
          const isEditing = editing?.category === category

          return (
            <div key={category} className={styles.row} onClick={() => !isEditing && person !== 'combined' && startEdit(category)}>
              <div className={styles.rowTop}>
                <span className={styles.categoryName}>{category}</span>
                {budget > 0 ? (
                  <span className={styles.amounts}>
                    <span className={styles.spendAmt}>₹{formatAmount(spend)}</span>
                    <span className={styles.budgetAmt}> / ₹{formatAmount(budget)}</span>
                  </span>
                ) : (
                  <span className={styles.noBudget}>{person === 'combined' ? 'No budget' : 'Tap to set'}</span>
                )}
              </div>

              {budget > 0 && (
                <>
                  <ProgressBar percent={percent} />
                  <div className={styles.rowBottom}>
                    <span className={remaining < 0 ? styles.over : styles.under}>
                      {remaining < 0 ? `₹${formatAmount(Math.abs(remaining))} over` : `₹${formatAmount(remaining)} left`}
                    </span>
                    <span className={styles.percent}>{percent}%</span>
                  </div>
                </>
              )}

              {isEditing && (
                <div className={styles.editRow} onClick={e => e.stopPropagation()}>
                  <span className={styles.rupee}>₹</span>
                  <input
                    className={styles.budgetInput}
                    type="number"
                    placeholder="Enter budget"
                    value={editing.value}
                    onChange={e => setEditing(prev => ({ ...prev, value: e.target.value }))}
                    autoFocus
                  />
                  <button className={styles.saveBtn} onClick={saveEdit} disabled={saving}>Save</button>
                  <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
