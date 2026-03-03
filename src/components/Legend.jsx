import { STATUS_CONFIG } from '../utils/timeUtils'
import styles from './Legend.module.css'

const ESTADOS = ['pronto-abrir', 'abierta', 'pronto-cerrar', 'cerrada', 'fuerza-mayor']

export default function Legend() {
  return (
    <div className={styles.legend}>
      {ESTADOS.map((estado) => {
        const cfg = STATUS_CONFIG[estado]
        return (
          <div key={estado} className={styles.item}>
            <span
              className={styles.dot}
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
            />
            <span className={styles.label}>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}
