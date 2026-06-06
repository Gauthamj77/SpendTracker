import { createContext, useState, useCallback } from 'react'
import { readConfig, writeConfig } from '../lib/sheetsClient.js'
import { useAuth } from '../hooks/useAuth.js'

export const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const { sheetId } = useAuth()
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [gauthamBudgets, setGauthamBudgets] = useState({})
  const [mariaBudgets, setMariaBudgets] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const loadConfig = useCallback(async () => {
    if (!sheetId) return
    try {
      const config = await readConfig(sheetId)
      setCategories(config.categories)
      setPaymentMethods(config.paymentMethods)
      setGauthamBudgets(config.gauthamBudgets || {})
      setMariaBudgets(config.mariaBudgets || {})
      setLoaded(true)
    } catch (e) {
      setError(e.message)
      setLoaded(true)
    }
  }, [sheetId])

  const saveCategories = useCallback(async (newCategories) => {
    setCategories(newCategories)
    await writeConfig(sheetId, newCategories, paymentMethods, gauthamBudgets, mariaBudgets)
  }, [sheetId, paymentMethods, gauthamBudgets, mariaBudgets])

  const savePaymentMethods = useCallback(async (newMethods) => {
    setPaymentMethods(newMethods)
    await writeConfig(sheetId, categories, newMethods, gauthamBudgets, mariaBudgets)
  }, [sheetId, categories, gauthamBudgets, mariaBudgets])

  const saveGauthamBudgets = useCallback(async (newBudgets) => {
    setGauthamBudgets(newBudgets)
    await writeConfig(sheetId, categories, paymentMethods, newBudgets, mariaBudgets)
  }, [sheetId, categories, paymentMethods, mariaBudgets])

  const saveMariaBudgets = useCallback(async (newBudgets) => {
    setMariaBudgets(newBudgets)
    await writeConfig(sheetId, categories, paymentMethods, gauthamBudgets, newBudgets)
  }, [sheetId, categories, paymentMethods, gauthamBudgets])

  return (
    <ConfigContext.Provider value={{
      categories, paymentMethods,
      gauthamBudgets, mariaBudgets,
      loaded, loadConfig, error,
      saveCategories, savePaymentMethods,
      saveGauthamBudgets, saveMariaBudgets
    }}>
      {children}
    </ConfigContext.Provider>
  )
}
