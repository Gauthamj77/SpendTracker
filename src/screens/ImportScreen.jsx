import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSheets } from '../hooks/useSheets.js'
import { useAuth } from '../hooks/useAuth.js'
import { generateId, toISOLocal } from '../lib/utils.js'
import { appendSpend } from '../lib/sheetsClient.js'
import Toast from '../components/Toast.jsx'
import styles from './ImportScreen.module.css'

const TEMPLATE_CSV = `Amount,Type,Category,PaymentMethod,Notes,Date,Time
450,Spend,Food,UPI,Lunch at office,07-06-2026,13:30
1200,Spend,Travel,Card,Flight tickets,07-06-2026,10:00
5000,Income,Other,Cash,Freelance payment,01-06-2026,09:00`

const COLUMNS = ['Amount', 'Type', 'Category', 'PaymentMethod', 'Notes', 'Date', 'Time']

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['CSV has no data rows'] }

  const header = lines[0].split(',').map(h => h.trim())
  const amtIdx = header.findIndex(h => h.toLowerCase() === 'amount')
  const typeIdx = header.findIndex(h => h.toLowerCase() === 'type')
  const catIdx = header.findIndex(h => h.toLowerCase() === 'category')
  const pmIdx = header.findIndex(h => h.toLowerCase() === 'paymentmethod')
  const notesIdx = header.findIndex(h => h.toLowerCase() === 'notes')
  const dateIdx = header.findIndex(h => h.toLowerCase() === 'date')
  const timeIdx = header.findIndex(h => h.toLowerCase() === 'time')

  if (amtIdx === -1) return { rows: [], errors: ['Missing required column: Amount'] }

  const rows = [], skipped = []
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(',').map(c => c.trim())
    const amount = parseFloat(cols[amtIdx])
    if (!amount || isNaN(amount)) { skipped.push(i + 2); return }

    const dateStr = dateIdx !== -1 ? cols[dateIdx] : ''
    const timeStr = timeIdx !== -1 ? cols[timeIdx] : ''
    let timestamp = toISOLocal()
    if (dateStr) {
      // Support dd-mm-yyyy or yyyy-mm-dd
      const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/')
      let isoDate
      if (parts[0].length === 4) {
        isoDate = dateStr.replace(/\//g, '-') // already yyyy-mm-dd
      } else {
        isoDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
      }
      const t = timeStr ? timeStr.slice(0, 5) : '00:00'
      timestamp = `${isoDate}T${t}:00`
    }

    rows.push({
      Amount: String(amount),
      Type: (typeIdx !== -1 && cols[typeIdx]) ? cols[typeIdx] : 'Spend',
      Category: (catIdx !== -1 && cols[catIdx]) ? cols[catIdx] : 'Other',
      PaymentMethod: (pmIdx !== -1 && cols[pmIdx]) ? cols[pmIdx] : 'UPI',
      Notes: notesIdx !== -1 ? cols[notesIdx] : '',
      Timestamp: timestamp,
    })
  })

  return { rows, skipped }
}

export default function ImportScreen() {
  const navigate = useNavigate()
  const { sheetId, userEmail } = useAuth()
  const fileRef = useRef()
  const [preview, setPreview] = useState(null) // { rows, skipped }
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [progress, setProgress] = useState(0)

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spend_tracker_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result)
      setPreview(result)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!preview?.rows?.length) return
    setImporting(true)
    setProgress(0)
    let done = 0
    try {
      for (const row of preview.rows) {
        await appendSpend(sheetId, {
          ID: generateId(),
          Timestamp: row.Timestamp,
          AddedBy: userEmail || 'import',
          Amount: row.Amount,
          Type: row.Type,
          Category: row.Category,
          PaymentMethod: row.PaymentMethod,
          Notes: row.Notes,
          EditedAt: ''
        })
        done++
        setProgress(Math.round((done / preview.rows.length) * 100))
      }
      setToast({ message: `${done} entries imported successfully`, type: 'success' })
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setToast({ message: `Import failed after ${done} rows: ${e.message}`, type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>Back</button>
        <h2 className={styles.title}>Import CSV</h2>
      </div>

      <div className={styles.body}>

        {/* Template section */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Step 1 - Download Template</h3>
          <p className={styles.cardDesc}>
            Download the template, fill in your data in Excel or Google Sheets, then upload it below.
          </p>
          <button className={styles.downloadBtn} onClick={downloadTemplate}>
            Download Template CSV
          </button>

          <div className={styles.formatBox}>
            <p className={styles.formatTitle}>Expected columns:</p>
            <div className={styles.columns}>
              {COLUMNS.map(c => <span key={c} className={styles.col}>{c}</span>)}
            </div>
            <div className={styles.formatNotes}>
              <p><strong>Amount</strong> - required, numeric (e.g. 450)</p>
              <p><strong>Type</strong> - Spend or Income (default: Spend)</p>
              <p><strong>Category</strong> - must match your categories (default: Other)</p>
              <p><strong>PaymentMethod</strong> - must match your methods (default: UPI)</p>
              <p><strong>Notes</strong> - optional</p>
              <p><strong>Date</strong> - dd-mm-yyyy or yyyy-mm-dd (default: today)</p>
              <p><strong>Time</strong> - HH:MM (default: 00:00)</p>
            </div>
          </div>
        </div>

        {/* Upload section */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Step 2 - Upload & Preview</h3>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className={styles.fileInput}
            onChange={handleFile}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Step 3 - Review & Import</h3>

            {preview.errors?.length > 0 && (
              <p className={styles.errorMsg}>{preview.errors[0]}</p>
            )}

            {preview.rows?.length > 0 && (
              <>
                <div className={styles.previewStats}>
                  <span className={styles.statGood}>✓ {preview.rows.length} rows ready to import</span>
                  {preview.skipped?.length > 0 && (
                    <span className={styles.statSkip}>✗ {preview.skipped.length} rows skipped (missing/invalid Amount)</span>
                  )}
                </div>

                <div className={styles.previewTable}>
                  <div className={styles.tableHeader}>
                    <span>Date</span><span>Category</span><span>Notes</span><span>Amount</span>
                  </div>
                  {preview.rows.slice(0, 10).map((row, i) => (
                    <div key={i} className={styles.tableRow}>
                      <span>{row.Timestamp.slice(0, 10)}</span>
                      <span>{row.Category}</span>
                      <span>{row.Notes || '-'}</span>
                      <span className={row.Type === 'Income' ? styles.income : styles.spend}>
                        {row.Type === 'Income' ? '+' : '-'}₹{row.Amount}
                      </span>
                    </div>
                  ))}
                  {preview.rows.length > 10 && (
                    <p className={styles.moreRows}>...and {preview.rows.length - 10} more rows</p>
                  )}
                </div>

                {importing && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                )}

                <button
                  className={styles.importBtn}
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? `Importing... ${progress}%` : `Import ${preview.rows.length} Entries`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
