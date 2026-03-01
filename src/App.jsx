import { useState, useEffect, useMemo } from 'react'
import WorldMap from './components/WorldMap'
import CountryPanel from './components/CountryPanel'
import Legend from './components/Legend'
import Stats from './components/Stats'
import mesasData from './data/mesas.json'
import styles from './App.module.css'

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')

  // Re-renderizar cada minuto para actualizar estados
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const config = useMemo(
    () => ({
      horaApertura: mesasData.horaApertura,
      horaCierre: mesasData.horaCierre,
      minutosAvisoApertura: mesasData.minutosAvisoApertura,
      minutosAvisoCierre: mesasData.minutosAvisoCierre,
    }),
    []
  )

  const paisesFiltrados = useMemo(() => {
    if (!search.trim()) return mesasData.paises
    const q = search.toLowerCase()
    return mesasData.paises.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.municipios.some((m) => m.ciudad.toLowerCase().includes(q))
    )
  }, [search])

  // Hora actual UTC
  const [utcTime, setUtcTime] = useState('')
  useEffect(() => {
    const update = () =>
      setUtcTime(
        new Date().toLocaleTimeString('es-CO', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.app}>
      {/* Top Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.flag}>🇨🇴</span>
            <div>
              <h1 className={styles.title}>Mesas de Votación</h1>
              <p className={styles.subtitle}>Colombia en el Mundo · {mesasData.fechaEleccion}</p>
            </div>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <Stats paises={mesasData.paises} config={config} key={tick} />
        </div>

        <div className={styles.headerRight}>
          <div className={styles.clock}>
            <span className={styles.clockLabel}>UTC</span>
            <span className={styles.clockTime}>{utcTime}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Mapa */}
        <div className={styles.mapContainer}>
          <WorldMap
            paises={mesasData.paises}
            config={config}
            selectedCountry={selectedCountry}
            onSelectCountry={(pais) => {
              setSelectedCountry((prev) =>
                prev?.codigo === pais.codigo ? null : pais
              )
            }}
            key={tick}
          />

          {/* Leyenda sobre el mapa */}
          <div className={styles.legendOverlay}>
            <Legend />
          </div>

          {/* Instrucción */}
          {!selectedCountry && (
            <div className={styles.mapHint}>
              Haz clic en un país o ciudad para ver sus mesas de votación
            </div>
          )}
        </div>

        {/* Panel lateral */}
        {selectedCountry && (
          <aside className={styles.sidebar}>
            <CountryPanel
              pais={selectedCountry}
              config={config}
              onClose={() => setSelectedCountry(null)}
              key={selectedCountry.codigo + tick}
            />
          </aside>
        )}
      </main>

      {/* Lista de países (buscador flotante) */}
      <div className={styles.searchPanel}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar país o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {search && (
          <div className={styles.searchResults}>
            {paisesFiltrados.length === 0 ? (
              <p className={styles.noResults}>No se encontraron resultados</p>
            ) : (
              paisesFiltrados.map((pais) => (
                <button
                  key={pais.codigo}
                  className={styles.searchResultItem}
                  onClick={() => {
                    setSelectedCountry(pais)
                    setSearch('')
                  }}
                >
                  <span>{countryFlag(pais.codigo)}</span>
                  <span>{pais.nombre}</span>
                  <span className={styles.resultMesas}>
                    {pais.municipios.reduce(
                      (acc, m) => acc + m.mesas.length,
                      0
                    )}{' '}
                    mesas
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍'
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => 0x1f1e0 + c.charCodeAt(0) - 65)
  )
}
