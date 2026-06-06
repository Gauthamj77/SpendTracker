import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../hooks/useConfig.js'
import { useAuth } from '../hooks/useAuth.js'
import Toast from '../components/Toast.jsx'
import styles from './SettingsScreen.module.css'

function EditableList({ items, onSave, label }) {
  const [list, setList] = useState(items)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const dirtyRef = useRef(false)

  // Sync when items load from the sheet (they may be empty on first render)
  useEffect(() => {
    if (items.length > 0) setList(items)
  }, [items])

  const add = async () => {
    if (!newItem.trim() || list.includes(newItem.trim())) return
    const otherIdx = list.indexOf('Other')
    const updated = otherIdx !== -1
      ? [...list.slice(0, otherIdx), newItem.trim(), ...list.slice(otherIdx)]
      : [...list, newItem.trim()]
    setList(updated)
    setNewItem('')
    setSaving(true)
    await onSave(updated)
    setSaving(false)
  }

  const rename = (index, value) => {
    const updated = list.map((item, i) => i === index ? value : item)
    setList(updated)
    dirtyRef.current = true
  }

  const handleBlur = async () => {
    if (!dirtyRef.current) return
    dirtyRef.current = false
    await onSave(list)
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{label}</h3>
      {list.map((item, i) => (
        <input
          key={i}
          className={styles.listItem}
          value={item}
          onChange={e => rename(i, e.target.value)}
          onBlur={handleBlur}
        />
      ))}
      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          placeholder={`New ${label === 'Categories' ? 'Category' : 'Payment Method'}`}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className={styles.addBtn} onClick={add} disabled={saving}>Add</button>
      </div>
    </div>
  )
}

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { categories, paymentMethods, loaded, loadConfig, saveCategories, savePaymentMethods } = useConfig()
  const { signOut } = useAuth()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!loaded) loadConfig()
  }, [loaded, loadConfig])

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>Back</button>
        <h2 className={styles.title}>Settings</h2>
      </div>

      <div className={styles.body}>
        {!loaded ? (
          <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 24 }}>Loading...</p>
        ) : (
          <>
            <EditableList
              label="Categories"
              items={categories}
              onSave={async (list) => {
                await saveCategories(list)
                setToast({ message: 'Saved', type: 'success' })
              }}
            />
            <EditableList
              label="Payment Methods"
              items={paymentMethods}
              onSave={async (list) => {
                await savePaymentMethods(list)
                setToast({ message: 'Saved', type: 'success' })
              }}
            />
          </>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Account</h3>
          <button className={styles.signOutBtn} onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
