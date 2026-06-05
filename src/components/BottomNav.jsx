import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : styles.link}>
        <span>⌨</span><small>Entry</small>
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.active : styles.link}>
        <span>📊</span><small>Dashboard</small>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? styles.active : styles.link}>
        <span>📋</span><small>History</small>
      </NavLink>
    </nav>
  )
}
