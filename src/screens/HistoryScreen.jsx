import { useState, useEffect, useCallback } from 'react'
import { useSheets } from '../hooks/useSheets.js'
import { useConfig } from '../hooks/useConfig.js'
import EntryForm from '../components/EntryForm.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Toast from '../components/Toast.jsx'
import { formatDate, formatAmount, getInitials, filterEntries } from '../lib/utils.js'
import { Link } from 'react-router-dom'
import styles from './HistoryScreen.module.css'

export default function HistoryScreen() {
  const { fetchAll, editEntry, removeEntry, loading } = useSheets()
  const { categories, loaded, loadConfig } = useConfig()
  const [entries, setEntries] = useState([])
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', person: 'both', type: 'both', category: '' })
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValues, setEditValues] = useState(null)
  const [deleteIndex, setDeleteIndex] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!loaded) loadConfig()
    fetchAll().then(setEntries).catch(() => {})
  }, [])

  const filtered = filterEntries(entries, filters)
    .map((e, i) => ({ ...e, _origIdx: i }))
    .reverse()

  const openEdit = (entry, i) => {
    const [date, time] = (entry.Timestamp || '').split('T')
    setEditValues({
      amount: entry.Amount,
      type: entry.Type,
      date: date || '',
      time: (time || '').slice(0, 5),
      category: entry.Category,
      paymentMethod: entry.PaymentMethod,
      notes: entry.Notes,
      _origIdx: entry._origIdx
    })
    setEditingIndex(i)
  }

  const handleEditChange = useCallback((field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleEditSave = async () => {
    const originalIndex = editValues._origIdx
    const timestamp = `${editValues.date}T${editValues.time}:00`
    try {
      const updated = await editEntry(originalIndex, { ...editValues, Timestamp: timestamp }, entries[originalIndex])
      const newEntries = [...entries]
      newEntries[originalIndex] = updated
      setEntries(newEntries)
      setEditingIndex(null)
      setToast({ message: 'Updated!', type: 'success' })
    } catch {
      setToast({ message: 'Update failed', type: 'error' })
    }
  }

  const handleDelete = async () => {
    const originalIndex = filtered[deleteIndex]._origIdx
    try {
      await removeEntry(originalIndex)
      setEntries(entries.filter((_, i) => i !== originalIndex))
      setDeleteIndex(null)
      setToast({ message: 'Deleted', type: 'success' })
    } catch {
      setToast({ message: 'Delete failed', type: 'error' })
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
        <Link to="/settings" className={styles.settings}>&#9881;</Link>
      </div>

      <div className={styles.filters}>
        <input type="date" className={styles.filterInput} value={filters.dateFrom} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} />
        <input type="date" className={styles.filterInput} value={filters.dateTo} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} />
        <select className={styles.filterInput} value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value}))}>
          <option value="both">All types</option>
          <option value="Spend">Spend</option>
          <option value="Income">Income</option>
        </select>
        <select className={styles.filterInput} value={filters.category} onChange={e => setFilters(f => ({...f, category: e.target.value}))}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      <div className={styles.list}>
        {filtered.map((entry, i) => (
          <div key={entry.ID || i} className={styles.row} onClick={() => openEdit(entry, i)}>
            <div className={styles.rowLeft}>
              <span className={styles.category}>{entry.Category}</span>
              <span className={styles.meta}>{formatDate(entry.Timestamp)} - {getInitials(entry.AddedBy)}</span>
              {entry.Notes && <span className={styles.notes}>{entry.Notes}</span>}
            </div>
            <div className={styles.rowRight}>
              <span className={entry.Type === 'Income' ? styles.income : styles.spend}>
                {entry.Type === 'Income' ? '+' : '-'}&#8377;{formatAmount(entry.Amount)}
              </span>
              <span className={styles.pm}>{entry.PaymentMethod}</span>
              <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); setDeleteIndex(i) }}>&#128465;</button>
            </div>
          </div>
        ))}
      </div>

      {editingIndex !== null && editValues && (
        <div className={styles.editSheet}>
          <div className={styles.editHeader}>
            <button onClick={() => setEditingIndex(null)}>Cancel</button>
            <span>Edit Entry</span>
            <button className={styles.saveBtn} onClick={handleEditSave}>Save</button>
          </div>
          <div className={styles.editBody}>
            <EntryForm values={editValues} onChange={handleEditChange} />
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <ConfirmDialog
          message="Delete this entry?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteIndex(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
