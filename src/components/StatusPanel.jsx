import { useMemo, useEffect, useRef } from 'react'
import { getMesaStatus, STATUS_CONFIG, esSoloDomingo } from '../utils/timeUtils'
import styles from './StatusPanel.module.css'

function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍'
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

export default function StatusPanel({ estado, paises, config, onClose, onSelectCountry }) {
  const cfg = STATUS_CONFIG[estado]
  const panelRef = useRef(null)

  const items = useMemo(() => {
    const result = []
    for (const pais of paises) {
      const municipiosFiltrados = pais.municipios.filter(
        (m) => getMesaStatus(m.timezone, config, esSoloDomingo(m.ciudad), m.fechaInicio) === estado
      )
      if (municipiosFiltrados.length > 0) {
        result.push({ pais, municipios: municipiosFiltrados })
      }
    }
    return result
  }, [paises, config, estado])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.header} style={{ borderBottomColor: cfg.colorBorder }}>
          <span className={styles.dot} style={{ background: cfg.color }} />
          <h2 className={styles.title}>{cfg.label}</h2>
          <span className={styles.count}>{items.reduce((a, i) => a + i.municipios.length, 0)} ciudades</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.list}>
          {items.length === 0 ? (
            <p className={styles.empty}>No hay mesas en este estado actualmente.</p>
          ) : (
            items.map(({ pais, municipios }) => (
              <div key={pais.codigo} className={styles.paisGroup}>
                <button
                  className={styles.paisRow}
                  onClick={() => { onSelectCountry(pais); onClose() }}
                >
                  <span className={styles.flag}>{countryFlag(pais.codigo)}</span>
                  <span className={styles.paisNombre}>{pais.nombre}</span>
                  <span className={styles.mesasBadge} style={{ color: cfg.color }}>
                    {municipios.reduce((a, m) => a + m.mesas.length, 0)} mesas
                  </span>
                </button>
                {municipios.map((m) => (
                  <div key={m.ciudad} className={styles.ciudadRow}>
                    <span className={styles.ciudadNombre}>{m.ciudad}</span>
                    <span className={styles.ciudadMesas}>{m.mesas.length} mesa{m.mesas.length !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
