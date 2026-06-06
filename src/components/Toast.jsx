import { useEffect, useRef } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, type = 'success', onClose }) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {message}
    </div>
  )
}
