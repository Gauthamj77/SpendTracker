import { getAccessToken } from './auth.js'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

function headers() {
  return { Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' }
}

const SPEND_COLS = ['ID','Timestamp','AddedBy','Amount','Type','Category','PaymentMethod','Notes','EditedAt']

function rowToEntry(row) {
  const entry = {}
  SPEND_COLS.forEach((col, i) => { entry[col] = row[i] ?? '' })
  return entry
}

function entryToRow(entry) {
  return SPEND_COLS.map(col => entry[col] ?? '')
}

export async function appendSpend(sheetId, entry) {
  const res = await fetch(
    `${BASE}/${sheetId}/values/${encodeURIComponent('Spends!A:I')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ values: [entryToRow(entry)] }) }
  )
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status}`)
  return res.json()
}

export async function readAllSpends(sheetId) {
  const res = await fetch(`${BASE}/${sheetId}/values/${encodeURIComponent('Spends!A2:I')}`, { headers: headers() })
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`)
  const data = await res.json()
  return (data.values || []).map(rowToEntry)
}

export async function updateSpend(sheetId, rowIndex, entry) {
  const sheetRow = rowIndex + 2
  const res = await fetch(
    `${BASE}/${sheetId}/values/${encodeURIComponent('Spends!A' + sheetRow + ':I' + sheetRow)}?valueInputOption=RAW`,
    { method: 'PUT', headers: headers(), body: JSON.stringify({ values: [entryToRow(entry)] }) }
  )
  if (!res.ok) throw new Error(`Sheets update failed: ${res.status}`)
  return res.json()
}

export async function deleteSpend(sheetId, sheetNumericId, rowIndex) {
  const sheetRow = rowIndex + 1
  const res = await fetch(
    `${BASE}/${sheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: { sheetId: sheetNumericId, dimension: 'ROWS', startIndex: sheetRow, endIndex: sheetRow + 1 }
          }
        }]
      })
    }
  )
  if (!res.ok) throw new Error(`Sheets delete failed: ${res.status}`)
  return res.json()
}

export async function readConfig(sheetId) {
  const res = await fetch(`${BASE}/${sheetId}/values/${encodeURIComponent('Config!A1:Z2')}`, { headers: headers() })
  if (!res.ok) throw new Error(`Config read failed: ${res.status}`)
  const data = await res.json()
  const rows = data.values || []
  const categories = rows[0] ? rows[0].filter(Boolean) : ['Food','Travel','Shopping','Bills','Health','Entertainment','Other']
  const paymentMethods = rows[1] ? rows[1].filter(Boolean) : ['Cash','UPI','Card','Net Banking']
  return { categories, paymentMethods }
}

export async function writeConfig(sheetId, categories, paymentMethods) {
  const res = await fetch(
    `${BASE}/${sheetId}/values/${encodeURIComponent('Config!A1:Z2')}?valueInputOption=RAW`,
    { method: 'PUT', headers: headers(), body: JSON.stringify({ values: [categories, paymentMethods] }) }
  )
  if (!res.ok) throw new Error(`Config write failed: ${res.status}`)
  return res.json()
}

export async function getSpendSheetNumericId(sheetId) {
  const res = await fetch(`${BASE}/${sheetId}?fields=sheets.properties`, { headers: headers() })
  if (!res.ok) throw new Error(`Sheet metadata failed: ${res.status}`)
  const data = await res.json()
  const sheet = data.sheets.find(s => s.properties.title === 'Spends')
  if (!sheet) throw new Error(`'Spends' tab not found in spreadsheet ${sheetId}`)
  return sheet.properties.sheetId
}
