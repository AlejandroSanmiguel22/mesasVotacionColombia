import { useState, useEffect, useMemo } from 'react'
import WorldMap from './components/WorldMap'
import CountryPanel from './components/CountryPanel'
import mesasData from './data/mesas.json'
import styles from './App.module.css'
import Stats from './components/Stats'
import Notifications from './components/Notifications'
import StatusPanel from './components/StatusPanel'
import logoElecciones from './assets/elecciones2026.webp'
import logoCancilleria from './assets/cancilleria.png'

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedEstado, setSelectedEstado] = useState(null)

  // Overrides de fuerza mayor (se guardan en localStorage)
  const [fuerzaMayorOverrides, setFuerzaMayorOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('fuerzaMayorOverrides')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const toggleFuerzaMayor = (codigoPais, ciudad) => {
    setFuerzaMayorOverrides(prev => {
      const key = `${codigoPais}-${ciudad}`
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = { motivo: 'Situación extraordinaria', fecha: new Date().toISOString() }
      }
      localStorage.setItem('fuerzaMayorOverrides', JSON.stringify(next))
      return next
    })
  }

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

  const [testNotif, setTestNotif] = useState(null)

  function lanzarPrueba() {
    const opciones = [
      {
        key: 'test-abrir',
        flag: '🇺🇸',
        pais: 'Estados Unidos',
        ciudad: 'Miami Consulado',
        estado: 'pronto-abrir',
        horaEvento: '08:00 a. m.',
        mesas: 3,
      },
      {
        key: 'test-cerrar',
        flag: '🇪🇸',
        pais: 'España',
        ciudad: 'Madrid Consulado',
        estado: 'pronto-cerrar',
        horaEvento: '04:00 p. m.',
        mesas: 2,
      },
    ]
    const notif = opciones[Math.floor(Math.random() * opciones.length)]
    setTestNotif(notif)
    setTimeout(() => setTestNotif(null), 6000)
  }

  // Hora actual UTC
  const [utcTime, setUtcTime] = useState('')
  useEffect(() => {
    const update = () =>
      setUtcTime(
        new Date().toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
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
            <img src={logoElecciones} alt="Elecciones 2026" className={styles.logoImg} />
            <div>
              <h1 className={styles.title}>Puestos de Votación</h1>
              <p className={styles.subtitle}>Colombia en el Mundo</p>
            </div>
          </div>
        </div>
        <div className={styles.headerCenter}>
          <Stats
            paises={mesasData.paises}
            config={config}
            key={tick}
            overrides={fuerzaMayorOverrides}
            onSelectEstado={(e) => setSelectedEstado((prev) => prev === e ? null : e)}
          />
        </div>

        <div className={styles.headerRight}>
          <img src={logoCancilleria} alt="Cancillería" className={styles.cancilleriaImg} />
          <div className={styles.clock}>
            <span className={styles.clockLabel}>Colombia</span>
            <span className={styles.clockTime}>{utcTime}</span>
          </div>
        </div>
      </header>

      {/* Panel de estado al clicar tarjeta Stats */}
      {selectedEstado && (
        <StatusPanel
          estado={selectedEstado}
          paises={mesasData.paises}
          config={config}
          overrides={fuerzaMayorOverrides}
          onClose={() => setSelectedEstado(null)}
          onSelectCountry={(pais) => {
            setSelectedCountry(pais)
            setSelectedEstado(null)
          }}
        />
      )}

      {/* Notificaciones de apertura/cierre */}
      <Notifications
        paises={mesasData.paises}
        config={config}
        tick={tick}
        overrides={fuerzaMayorOverrides}
      />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Mapa */}
        <div className={styles.mapContainer}>
          <WorldMap
            paises={mesasData.paises}
            config={config}
            selectedCountry={selectedCountry}
            overrides={fuerzaMayorOverrides}
            onSelectCountry={(pais) => {
              setSelectedCountry((prev) =>
                prev?.codigo === pais.codigo ? null : pais
              )
            }}
            key={tick}
          />


        </div>

        {/* Panel lateral */}
        {selectedCountry && (
          <aside className={styles.sidebar}>
            <CountryPanel
              pais={selectedCountry}
              config={config}
              overrides={fuerzaMayorOverrides}
              onToggleFuerzaMayor={toggleFuerzaMayor}
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
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}
