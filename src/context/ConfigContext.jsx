import { createContext, useState, useCallback } from 'react'
import { readConfig, writeConfig } from '../lib/sheetsClient.js'
import { useAuth } from '../hooks/useAuth.js'

export const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const { sheetId } = useAuth()
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const loadConfig = useCallback(async () => {
    if (!sheetId) return
    try {
      const config = await readConfig(sheetId)
      setCategories(config.categories)
      setPaymentMethods(config.paymentMethods)
      setLoaded(true)
    } catch (e) {
      setError(e.message)
      setLoaded(true)  // stop the spinner even on error
    }
  }, [sheetId])

  const saveCategories = useCallback(async (newCategories) => {
    setCategories(newCategories)
    await writeConfig(sheetId, newCategories, paymentMethods)
  }, [sheetId, paymentMethods])

  const savePaymentMethods = useCallback(async (newMethods) => {
    setPaymentMethods(newMethods)
    await writeConfig(sheetId, categories, newMethods)
  }, [sheetId, categories])

  return (
    <ConfigContext.Provider value={{ categories, paymentMethods, loaded, loadConfig, saveCategories, savePaymentMethods, error }}>
      {children}
    </ConfigContext.Provider>
  )
}

