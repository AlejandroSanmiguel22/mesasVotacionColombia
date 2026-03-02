import { useMemo } from 'react'
import { getMesaStatus, getLocalTime, STATUS_CONFIG, esSoloDomingo } from '../utils/timeUtils'
import styles from './CountryPanel.module.css'

export default function CountryPanel({ pais, config, onClose }) {
  const municipiosConEstado = useMemo(
    () =>
      pais.municipios.map((municipio) => ({
        ...municipio,
        estado: getMesaStatus(municipio.timezone, config, esSoloDomingo(municipio.ciudad), municipio.fechaInicio),
        horaLocal: getLocalTime(municipio.timezone),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pais]
  )

  const totalMesas = municipiosConEstado.reduce(
    (acc, m) => acc + m.mesas.length,
    0
  )
  const mesasAbiertas = municipiosConEstado.reduce(
    (acc, m) =>
      acc +
      (m.estado === 'abierta' || m.estado === 'pronto-cerrar'
        ? m.mesas.length
        : 0),
    0
  )

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <img
            className={styles.flag}
            src={`https://flagcdn.com/48x36/${pais.codigo.toLowerCase()}.png`}
            alt={pais.nombre}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div>
            <h2 className={styles.countryName}>{pais.nombre}</h2>
            <p className={styles.subtitle}>
              {totalMesas} mesa{totalMesas !== 1 ? 's' : ''} •{' '}
              {pais.municipios.length} ciudad
              {pais.municipios.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Resumen */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span style={{ color: STATUS_CONFIG['abierta'].color }}>●</span>
          <span>{mesasAbiertas} abiertas</span>
        </div>
        <div className={styles.summaryItem}>
          <span style={{ color: STATUS_CONFIG['cerrada'].color }}>●</span>
          <span>{totalMesas - mesasAbiertas} cerradas</span>
        </div>
      </div>

      {/* Lista de municipios y mesas */}
      <div className={styles.municipiosList}>
        {municipiosConEstado.map((municipio) => {
          const statusCfg = STATUS_CONFIG[municipio.estado]

          return (
            <div key={municipio.ciudad} className={styles.municipioCard}>
              <div className={styles.municipioHeader}>
                <div className={styles.municipioInfo}>
                  <div
                    className={styles.statusDot}
                    style={{ background: statusCfg.color }}
                  />
                  <h3 className={styles.municipioName}>{municipio.ciudad}</h3>
                </div>
                <div className={styles.municipioMeta}>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: statusCfg.colorBg,
                      border: `1px solid ${statusCfg.colorBorder}`,
                      color: statusCfg.color,
                    }}
                  >
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  <span className={styles.localTime}>
                    🕐 {municipio.horaLocal}
                  </span>
                </div>
              </div>

              <p className={styles.statusDesc}>{statusCfg.descripcion}</p>

              <div className={styles.mesasList}>
                {municipio.mesas.map((mesa) => (
                  <div key={mesa.numero} className={styles.mesaItem}>
                    <div className={styles.mesaNumero}>
                      <span
                        className={styles.mesaNum}
                        style={{ background: statusCfg.colorBg, color: statusCfg.color, borderColor: statusCfg.colorBorder }}
                      >
                        #{mesa.numero}
                      </span>
                    </div>
                    <div className={styles.mesaDetalles}>
                      <p className={styles.mesaPuesto}>{mesa.puesto}</p>
                      <p className={styles.mesaDireccion}>📍 {mesa.direccion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Mesas abren a las <strong>8:00 AM</strong> y cierran a las <strong>4:00 PM</strong> hora local</p>
      </div>
    </div>
  )
}


