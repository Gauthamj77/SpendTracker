import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { useSheets } from '../hooks/useSheets.js'
import { useConfig } from '../hooks/useConfig.js'
import { filterEntries, getDateRange, formatAmount, getDisplayName } from '../lib/utils.js'
import { Link } from 'react-router-dom'
import Toast from '../components/Toast.jsx'
import styles from './DashboardScreen.module.css'

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#be185d','#65a30d']
const PRESETS = ['thisMonth','lastMonth','last3Months']
const PRESET_LABELS = { thisMonth: 'This Month', lastMonth: 'Last Month', last3Months: '3 Months' }

const ChartTooltip = ({ active, payload, label, color = '#2563eb' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem' }}>
      {label && <p style={{ color: '#4b5563', marginBottom: 2 }}>{label}</p>}
      <p style={{ color, fontWeight: 700 }}>₹{formatAmount(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardScreen() {
  const { fetchAll, loading } = useSheets()
  const { gauthamBudgets, mariaBudgets, categories, loaded, loadConfig } = useConfig()
  const [allEntries, setAllEntries] = useState([])
  const [preset, setPreset] = useState('thisMonth')
  const [person, setPerson] = useState('both')
  const [excludeRent, setExcludeRent] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!loaded) loadConfig()
    fetchAll().then(setAllEntries).catch(() => setToast({ message: 'Failed to load entries. Please refresh.', type: 'error' }))
  }, [])

  const { dateFrom, dateTo } = getDateRange(preset)

  // Entries with rent optionally excluded - applied at source so all charts are covered
  const baseEntries = useMemo(() =>
    excludeRent ? allEntries.filter(e => e.Category !== 'Rent') : allEntries,
    [allEntries, excludeRent]
  )

  // Only spend entries for selected person and period
  const spendEntries = useMemo(() =>
    filterEntries(baseEntries, { dateFrom, dateTo, person, type: 'Spend' }),
    [baseEntries, dateFrom, dateTo, person]
  )

  const totalSpend = useMemo(() =>
    spendEntries.reduce((s, e) => s + parseFloat(e.Amount || 0), 0),
    [spendEntries]
  )

  // Budget remaining for this month (only shown for thisMonth preset)
  const budgetRemaining = useMemo(() => {
    if (preset !== 'thisMonth') return null
    const { dateFrom: mFrom, dateTo: mTo } = getDateRange('thisMonth')
    const monthSpend = filterEntries(allEntries, { dateFrom: mFrom, dateTo: mTo, person, type: 'Spend' })
    const budgets = person === 'both'
      ? Object.fromEntries(categories.map(c => [c, (gauthamBudgets[c] || 0) + (mariaBudgets[c] || 0)]))
      : person === 'G' ? gauthamBudgets : mariaBudgets
    const totalBudget = categories.reduce((s, c) => s + (budgets[c] || 0), 0)
    if (totalBudget === 0) return null
    const spent = monthSpend.reduce((s, e) => s + parseFloat(e.Amount || 0), 0)
    const today = new Date()
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const daysLeft = lastDay - today.getDate()
    return { total: totalBudget, spent, remaining: totalBudget - spent, daysLeft }
  }, [allEntries, categories, gauthamBudgets, mariaBudgets, person, preset])

  // Daily average: total / days elapsed in the period
  const dailyAverage = useMemo(() => {
    if (!dateFrom || spendEntries.length === 0) return 0
    const from = new Date(dateFrom)
    const to = dateTo ? new Date(dateTo) : new Date()
    const days = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1)
    return Math.round(totalSpend / days)
  }, [totalSpend, dateFrom, dateTo, spendEntries])

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map = {}
    spendEntries.forEach(e => {
      map[e.Category] = (map[e.Category] || 0) + parseFloat(e.Amount || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [spendEntries])

  // Daily spend for bar chart
  const dailyData = useMemo(() => {
    const map = {}
    spendEntries.forEach(e => {
      const day = (e.Timestamp || '').slice(0, 10)
      map[day] = (map[day] || 0) + parseFloat(e.Amount || 0)
    })
    return Object.entries(map).sort().map(([date, amount]) => ({
      date: formatDayLabel(date),
      amount: Math.round(amount)
    }))
  }, [spendEntries])

  // Running balance (cumulative spend)
  const runningData = useMemo(() => {
    const map = {}
    spendEntries.forEach(e => {
      const day = (e.Timestamp || '').slice(0, 10)
      map[day] = (map[day] || 0) + parseFloat(e.Amount || 0)
    })
    let cumulative = 0
    return Object.entries(map).sort().map(([date, amount]) => {
      cumulative += Math.round(amount)
      return { date: formatDayLabel(date), total: cumulative }
    })
  }, [spendEntries])

  // Top 5 individual spends
  const top5Data = useMemo(() => {
    return [...spendEntries]
      .sort((a, b) => parseFloat(b.Amount) - parseFloat(a.Amount))
      .slice(0, 5)
      .map(e => ({
        name: e.Notes || e.Category,
        amount: Math.round(parseFloat(e.Amount || 0))
      }))
  }, [spendEntries])

  // Category trend: this period vs previous period
  const categoryTrendData = useMemo(() => {
    const prevPreset = preset === 'thisMonth' ? 'lastMonth' : preset === 'lastMonth' ? 'last3Months' : null
    if (!prevPreset) return []
    const { dateFrom: prevFrom, dateTo: prevTo } = getDateRange(prevPreset)
    const prevEntries = filterEntries(baseEntries, { dateFrom: prevFrom, dateTo: prevTo, person, type: 'Spend' })
    const current = {}, previous = {}
    spendEntries.forEach(e => { current[e.Category] = (current[e.Category] || 0) + parseFloat(e.Amount || 0) })
    prevEntries.forEach(e => { previous[e.Category] = (previous[e.Category] || 0) + parseFloat(e.Amount || 0) })
    const allCats = [...new Set([...Object.keys(current), ...Object.keys(previous)])]
    return allCats.map(cat => ({
      name: cat,
      Current: Math.round(current[cat] || 0),
      Previous: Math.round(previous[cat] || 0)
    })).filter(d => d.Current > 0 || d.Previous > 0)
  }, [spendEntries, baseEntries, preset, person])

  // Weekday vs Weekend
  const weekdayData = useMemo(() => {
    const days = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    spendEntries.forEach(e => {
      const d = new Date(e.Timestamp || '')
      if (!isNaN(d)) {
        const name = DAY_NAMES[d.getDay()]
        days[name] = (days[name] || 0) + parseFloat(e.Amount || 0)
      }
    })
    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({
      day,
      amount: Math.round(days[day] || 0),
      isWeekend: day === 'Sat' || day === 'Sun'
    }))
  }, [spendEntries])

  const prevLabel = preset === 'thisMonth' ? 'Last Month' : preset === 'lastMonth' ? 'Last 3 Months' : null

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
        <button
          className={excludeRent ? styles.activeFilterRent : styles.filterRent}
          onClick={() => setExcludeRent(v => !v)}
        >
          {excludeRent ? 'Rent excluded' : 'Include Rent'}
        </button>
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.body}>

          {/* Summary cards */}
          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Total Spend</span>
              <span className={styles.cardSpend}>₹{formatAmount(totalSpend)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Daily Average</span>
              <span className={styles.cardSpend}>₹{formatAmount(dailyAverage)}</span>
            </div>
            {budgetRemaining && (
              <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.cardLabel}>Budget Remaining This Month</span>
                <span className={budgetRemaining.remaining < 0 ? styles.cardSpend : styles.cardIncome}>
                  {budgetRemaining.remaining < 0 ? '-' : ''}₹{formatAmount(Math.abs(budgetRemaining.remaining))}
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--gray-400)', marginLeft: 8 }}>
                    of ₹{formatAmount(budgetRemaining.total)}
                  </span>
                </span>
                {/* Progress bar */}
                {(() => {
                  const pct = Math.min(100, Math.round((budgetRemaining.spent / budgetRemaining.total) * 100))
                  const barColor = pct >= 100 ? 'var(--red)' : pct >= 80 ? '#d97706' : 'var(--blue)'
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ background: 'var(--gray-200)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                        {pct}% used
                      </span>
                    </div>
                  )
                })()}
                {/* Burn rate */}
                {budgetRemaining.daysLeft > 0 && budgetRemaining.remaining > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                    {budgetRemaining.daysLeft} days left, you can spend ₹{formatAmount(Math.round(budgetRemaining.remaining / budgetRemaining.daysLeft))} per day
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={categoryData.length * 44 + 20}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 70, left: 4, bottom: 0 }}>
                  <XAxis type="number" tick={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip formatter={v => `₹${formatAmount(v)}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <LabelList dataKey="value" position="right" formatter={v => `₹${formatAmount(v)}`} style={{ fontSize: 11, fill: '#4b5563' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Running Balance */}
          {runningData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Running Balance</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={runningData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip color="#2563eb" />} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily Spend */}
          {dailyData.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Daily Spend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip color="#2563eb" />} />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 Spends */}
          {top5Data.length > 0 && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Top 5 Spends</h3>
              <ResponsiveContainer width="100%" height={top5Data.length * 44 + 20}>
                <BarChart data={top5Data} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip content={<ChartTooltip color="#7c3aed" />} />
                  <Bar dataKey="amount" fill="#7c3aed" radius={[0,4,4,0]}
                    label={{ position: 'right', formatter: v => `₹${formatAmount(v)}`, fontSize: 11, fill: '#4b5563' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Trend */}
          {categoryTrendData.length > 0 && prevLabel && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Category Trend</h3>
              <p className={styles.chartSub}>{PRESET_LABELS[preset]} vs {prevLabel}</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `₹${formatAmount(v)}`} />
                  <Bar dataKey="Current" fill="#2563eb" radius={[4,4,0,0]} />
                  <Bar dataKey="Previous" fill="#d1d5db" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: '0.75rem', color: '#6b7280' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#2563eb', borderRadius: 2, marginRight: 4 }}></span>{PRESET_LABELS[preset]}</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#d1d5db', borderRadius: 2, marginRight: 4 }}></span>{prevLabel}</span>
              </div>
            </div>
          )}

          {/* Weekday vs Weekend */}
          {weekdayData.some(d => d.amount > 0) && (
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Spending by Day</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem' }}>
                      <p style={{ color: '#4b5563', marginBottom: 2 }}>{label}</p>
                      <p style={{ color: payload[0].payload.isWeekend ? '#d97706' : '#2563eb', fontWeight: 700 }}>₹{formatAmount(payload[0].value)}</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="amount" radius={[4,4,0,0]}>
                    {weekdayData.map((entry, i) => (
                      <Cell key={i} fill={entry.isWeekend ? '#d97706' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: '0.75rem', color: '#6b7280' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#2563eb', borderRadius: 2, marginRight: 4 }}></span>Weekday</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#d97706', borderRadius: 2, marginRight: 4 }}></span>Weekend</span>
              </div>
            </div>
          )}

          {spendEntries.length === 0 && (
            <p className={styles.empty}>No entries for this period.</p>
          )}
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function formatDayLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  const dd = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-IN', { month: 'long' })
  return `${dd} ${month}`
}
