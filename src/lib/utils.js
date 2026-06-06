export function generateId() {
  return crypto.randomUUID().split('-')[0]
}

const EMAIL_TO_NAME = {
  'gautham77bl@gmail.com': 'Gautham',
  'mariatbenedict726@gmail.com': 'Maria'
}

export function getDisplayName(email) {
  return EMAIL_TO_NAME[email] || email?.split('@')[0] || 'Unknown'
}

export function toISOLocal(date = new Date()) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 19)
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatAmount(amount) {
  return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })
}

export function getInitials(email) {
  return email ? email[0].toUpperCase() : '?'
}

export function filterEntries(entries, { dateFrom, dateTo, person, type, category }) {
  return entries.filter(e => {
    if (dateFrom && e.Timestamp < dateFrom) return false
    if (dateTo && e.Timestamp > dateTo + 'T23:59:59') return false
    if (person && person !== 'both' && getInitials(e.AddedBy) !== person) return false
    if (type && type !== 'both' && e.Type !== type) return false
    if (category && e.Category !== category) return false
    return true
  })
}

export function getDateRange(preset) {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  if (preset === 'thisMonth') return {
    dateFrom: toISOLocal(new Date(y, m, 1)).slice(0, 10),
    dateTo: toISOLocal(now).slice(0, 10)
  }
  if (preset === 'lastMonth') return {
    dateFrom: toISOLocal(new Date(y, m - 1, 1)).slice(0, 10),
    dateTo: toISOLocal(new Date(y, m, 0)).slice(0, 10)
  }
  if (preset === 'last3Months') return {
    dateFrom: toISOLocal(new Date(y, m - 3, 1)).slice(0, 10),
    dateTo: toISOLocal(now).slice(0, 10)
  }
  return { dateFrom: '', dateTo: '' }
}
