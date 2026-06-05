import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import { ConfigProvider } from './context/ConfigContext.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import NumpadScreen from './screens/NumpadScreen.jsx'
import DashboardScreen from './screens/DashboardScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import BottomNav from './components/BottomNav.jsx'

function AppRoutes() {
  const { accessToken, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      Loading...
    </div>
  )
  if (!accessToken) return <AuthScreen />

  return (
    <ConfigProvider>
      <div style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
        <Routes>
          <Route path="/" element={<NumpadScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
