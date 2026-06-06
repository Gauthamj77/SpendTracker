import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useSheets } from '../hooks/useSheets.js'
import { filterEntries, getDateRange, formatAmount } from '../lib/utils.js'
import { Link } from 'react-router-dom'
import Toast from '../components/Toast.jsx'
import styles from './DashboardScreen.module.css'

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#be185d','#65a30d']
const PRESETS = ['thisMonth','lastMonth','last3Months']
const PRESET_LABELS = { thisMonth: 'This Month', lastMonth: 'Last Month', last3Months: '3 Months' }

export default function DashboardScreen() {
  const { fetchAll, loading } = useSheets()
  const [allEntries, setAllEntries] = useState([])
  const [preset, setPreset] = useState('thisMonth')
  const [person, setPerson] = useState('both')
  const [type, setType] = useState('both')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchAll().then(setAllEntries).catch(() => setToast({ message: 'Failed to load entries. Please refresh.', type: 'error' }))
  }, [])

  const { dateFrom, dateTo } = getDateRange(preset)

  const entries = useMemo(() =>
    filterEntries(allEntries, { dateFrom, dateTo, person, type }),
    [allEntries, dateFrom, dateTo, person, type]
  )

  const totalSpend = useMemo(() =>
    entries.filter(e => e.Type === 'Spend').reduce((s, e) => s + parseFloat(e.Amount || 0), 0),
    [entries]
  )

  const totalIncome = useMemo(() =>
    entries.filter(e => e.Type === 'Income').reduce((s, e) => s + parseFloat(e.Amount || 0), 0),
    [entries]
  )

  const categoryData = useMemo(() => {
    const map = {}
    entries.filter(e => e.Type === 'Spend').forEach(e => {
      map[e.Category] = (map[e.Category] || 0) + parseFloat(e.Amount || 0)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [entries])

  const dailyData = useMemo(() => {
    const map = {}
    entries.filter(e => e.Type === 'Spend').forEach(e => {
      const day = (e.Timestamp || '').slice(0, 10)
      map[day] = (map[day] || 0) + parseFloat(e.Amount || 0)
    })
    return Object.entries(map).sort().map(([date, amount]) => ({ date: date.slice(5), amount: Math.round(amount) }))
  }, [entries])

  const weeklyData = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const week = getWeekLabel(e.Timestamp)
      if (!map[week]) map[week] = { week, Spend: 0, Income: 0 }
      map[week][e.Type] = (map[week][e.Type] || 0) + parseFloat(e.Amount || 0)
    })
    return Object.values(map).sort((a, b) => a.week.localeCompare(b.week))
      .map(w => ({ ...w, Spend: Math.round(w.Spend), Income: Math.round(w.Income) }))
  }, [entries])

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <Link to="/settings" className={styles.settings}>&#9881;</Link>
      </div>

      <div className={styles.filters}>
        {PRESETS.map(p => (
          <button key={p} className={preset === p ? styles.activeFilter : styles.filter} onClick={() => setPreset(p)}>
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      <div className={styles.personFilter}>
        {[
          { value: 'both', label: 'Both' },
          { value: 'G', label: 'Gautham' },
          { value: 'M', label: 'Maria' }
        ].map(p => (
          <button key={p.value} className={person === p.value ? styles.activeFilter : styles.filter} onClick={() => setPerson(p.value)}>
            {p.label}
          </button>
        ))}
        {['both','Spend','Income'].map(t => (
          <button key={t} className={type === t ? styles.activeFilter : styles.filter} onClick={() => setType(t)}>
            {t === 'both' ? 'All' : t}
          </button>
        ))}
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.body}>
          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Total Spend</span>
              <span className={styles.cardSpend}>&#8377;{formatAmount(totalSpend)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Total Income</span>
              <span className={styles.cardIncome}>&#8377;{formatAmount(totalIncome)}</span>
            </div>
          </div>

          {categoryData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `&#8377;${formatAmount(v)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {dailyData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Daily Spend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `&#8377;${formatAmount(v)}`} />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {weeklyData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Spend vs Income</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `&#8377;${formatAmount(v)}`} />
                  <Legend />
                  <Bar dataKey="Spend" fill="#dc2626" radius={[4,4,0,0]} />
                  <Bar dataKey="Income" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {entries.length === 0 && (
            <p className={styles.empty}>No entries for this period.</p>
          )}
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function getWeekLabel(isoTimestamp) {
  if (!isoTimestamp) return 'Unknown'
  const d = new Date(isoTimestamp)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return monday.toISOString().slice(5, 10)
}
