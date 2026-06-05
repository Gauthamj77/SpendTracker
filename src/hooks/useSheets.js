import { useState, useCallback } from 'react'
import { useAuth } from './useAuth.js'
import { appendSpend, readAllSpends, updateSpend, deleteSpend, getSpendSheetNumericId } from '../lib/sheetsClient.js'
import { generateId, toISOLocal } from '../lib/utils.js'

export function useSheets() {
  const { sheetId, accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addEntry = useCallback(async ({ amount, type, category, paymentMethod, notes, timestamp }) => {
    setLoading(true)
    setError(null)
    try {
      const entry = {
        ID: generateId(),
        Timestamp: timestamp || toISOLocal(),
        AddedBy: accessToken ? parseJwt(accessToken)?.email ?? 'unknown' : 'unknown',
        Amount: String(amount),
        Type: type,
        Category: category,
        PaymentMethod: paymentMethod,
        Notes: notes || '',
        EditedAt: ''
      }
      await appendSpend(sheetId, entry)
      return entry
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [sheetId, accessToken])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      return await readAllSpends(sheetId)
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [sheetId])

  const editEntry = useCallback(async (rowIndex, updatedFields, existingEntry) => {
    const updated = { ...existingEntry, ...updatedFields, EditedAt: toISOLocal() }
    await updateSpend(sheetId, rowIndex, updated)
    return updated
  }, [sheetId])

  const removeEntry = useCallback(async (rowIndex) => {
    const numericId = await getSpendSheetNumericId(sheetId)
    await deleteSpend(sheetId, numericId, rowIndex)
  }, [sheetId])

  return { addEntry, fetchAll, editEntry, removeEntry, loading, error }
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}
