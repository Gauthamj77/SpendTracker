import { useContext } from 'react'
import { ConfigContext } from '../context/ConfigContext.jsx'

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}
