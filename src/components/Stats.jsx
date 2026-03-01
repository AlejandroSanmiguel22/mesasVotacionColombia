import { useMemo } from 'react'
import { getCountryStatus, STATUS_CONFIG } from '../utils/timeUtils'
import styles from './Stats.module.css'

export default function Stats({ paises, config }) {
  const conteos = useMemo(() => {
    const result = { 'abierta': 0, 'pronto-abrir': 0, 'pronto-cerrar': 0, cerrada: 0 }
    let totalMesas = 0

    for (const pais of paises) {
      for (const municipio of pais.municipios) {
        const estado = getCountryStatus({ municipios: [municipio] }, config)
        const mesasCount = municipio.mesas.length
        result[estado] = (result[estado] || 0) + mesasCount
        totalMesas += mesasCount
      }
    }

    return { ...result, total: totalMesas }
  }, [paises, config])

  return (
    <div className={styles.stats}>
      {['abierta', 'pronto-cerrar', 'pronto-abrir', 'cerrada'].map((estado) => {
        const cfg = STATUS_CONFIG[estado]
        return (
          <div
            key={estado}
            className={styles.statCard}
            style={{ borderColor: cfg.colorBorder, background: cfg.colorBg }}
          >
            <span className={styles.statNum} style={{ color: cfg.color }}>
              {conteos[estado] || 0}
            </span>
            <span className={styles.statLabel}>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}
