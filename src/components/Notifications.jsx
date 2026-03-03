import { useMemo, useState, useEffect, useRef } from 'react'
import { getMesaStatus, STATUS_CONFIG, esSoloDomingo } from '../utils/timeUtils'
import styles from './Notifications.module.css'

function getEventTime(timezone, hora, minuto) {
  try {
    const now = new Date()
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    localDate.setHours(hora, minuto, 0, 0)
    return localDate.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '--:--'
  }
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍'
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

export default function Notifications({ paises, config, extraNotifs = [], tick, overrides = {} }) {
  const [dismissed, setDismissed] = useState(new Set())
  const isFirstRender = useRef(true)
  const prevKeysRef = useRef(new Set())

  const notifs = useMemo(() => {
    setDismissed(new Set())
    const result = []
    for (const pais of paises) {
      for (const municipio of pais.municipios) {
        const key = `${pais.codigo}-${municipio.ciudad}`
        if (overrides[key]) continue // Saltar municipios marcados como fuerza mayor
        const estado = getMesaStatus(municipio.timezone, config, esSoloDomingo(municipio.ciudad), municipio.fechaInicio)
        if (estado === 'pronto-abrir' || estado === 'pronto-cerrar') {
          const esApertura = estado === 'pronto-abrir'
          const { hora, minuto } = esApertura
            ? config.horaApertura
            : config.horaCierre
          result.push({
            key: `${pais.codigo}-${municipio.ciudad}`,
            flag: countryFlag(pais.codigo),
            pais: pais.nombre,
            ciudad: municipio.ciudad,
            estado,
            horaEvento: getEventTime(municipio.timezone, hora, minuto),
            mesas: municipio.mesas.length,
          })
        }
      }
    }

    if (isFirstRender.current) {
      // En la carga inicial, registrar todos como "ya vistos" sin mostrarlos
      isFirstRender.current = false
      prevKeysRef.current = new Set(result.map((n) => n.key))
      return []
    }

    // Solo mostrar los que son nuevos respecto al tick anterior
    const newNotifs = result.filter((n) => !prevKeysRef.current.has(n.key))
    prevKeysRef.current = new Set(result.map((n) => n.key))
    return newNotifs
  }, [paises, config, tick])

  const dismiss = (key) => setDismissed((prev) => new Set([...prev, key]))

  const scheduledRef = useRef(new Set())
  const all = [...extraNotifs, ...notifs].filter((n) => !dismissed.has(n.key))
  const allKeys = all.map((n) => n.key).join(',')

  // Auto-dismiss cada notificación a los 8 segundos de aparecer
  useEffect(() => {
    all.forEach((n) => {
      if (!scheduledRef.current.has(n.key)) {
        scheduledRef.current.add(n.key)
        setTimeout(() => {
          dismiss(n.key)
          scheduledRef.current.delete(n.key)
        }, 8000)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allKeys])
  if (all.length === 0) return null

  return (
    <div className={styles.panel}>
      {all.map((n) => {
        const cfg = STATUS_CONFIG[n.estado]
        const esApertura = n.estado === 'pronto-abrir'
        return (
          <div
            key={n.key}
            className={styles.card}
            style={{ borderLeftColor: cfg.color }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.flag}>{n.flag}</span>
              <span className={styles.pais}>{n.pais}</span>
              <span
                className={styles.badge}
                style={{
                  background: cfg.colorBg,
                  color: cfg.color,
                  borderColor: cfg.colorBorder,
                }}
              >
                {cfg.label}
              </span>
              <button className={styles.closeBtn} onClick={() => dismiss(n.key)}>✕</button>
            </div>
            <p className={styles.ciudad}>{n.ciudad}</p>
            <p className={styles.hora}>
              {esApertura ? '⏱ Abre a las' : '🔔 Cierra a las'}{' '}
              <strong>{n.horaEvento}</strong>{' '}
              <span className={styles.mesasCount}>· {n.mesas} {n.mesas === 1 ? 'mesa' : 'mesas'}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
