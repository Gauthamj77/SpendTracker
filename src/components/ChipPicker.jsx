import styles from './ChipPicker.module.css'

export default function ChipPicker({ label, options, value, onChange }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chips}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            className={value === opt ? styles.selected : styles.chip}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
