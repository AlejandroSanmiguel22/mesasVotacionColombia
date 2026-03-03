import { useMemo } from 'react'
import { getCountryStatus, STATUS_CONFIG } from '../utils/timeUtils'
import styles from './Stats.module.css'

export default function Stats({ paises, config, onSelectEstado, overrides = {} }) {
  const conteos = useMemo(() => {
    const result = { 'abierta': 0, 'pronto-abrir': 0, 'pronto-cerrar': 0, cerrada: 0, 'fuerza-mayor': 0 }
    let totalMesas = 0

    for (const pais of paises) {
      for (const municipio of pais.municipios) {
        const key = `${pais.codigo}-${municipio.ciudad}`
        const esFM = !!overrides[key]
        const estado = getCountryStatus({ municipios: [municipio], codigo: pais.codigo }, config, overrides)
        const mesasCount = municipio.mesas.length
        result[estado] = (result[estado] || 0) + mesasCount
        totalMesas += mesasCount
      }
    }

    return { ...result, total: totalMesas }
  }, [paises, config, overrides])

  return (
    <div className={styles.stats}>
      {['abierta', 'pronto-cerrar', 'pronto-abrir', 'cerrada', 'fuerza-mayor'].map((estado) => {
        const cfg = STATUS_CONFIG[estado]
        return (
          <div
            key={estado}
            className={styles.statCard}
            style={{ borderColor: cfg.colorBorder, background: cfg.colorBg, cursor: 'pointer' }}
            onClick={() => onSelectEstado?.(estado)}
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
