import { useState, useEffect, useCallback, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { getCountryStatus, STATUS_CONFIG } from '../utils/timeUtils'
import styles from './WorldMap.module.css'

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Mapa de alpha-2 a numeric ISO para comparar con TopoJSON
import COUNTRY_MAP from '../data/countryCodeMap.json'

const WorldMap = memo(({ paises, config, selectedCountry, onSelectCountry }) => {
  const [tooltip, setTooltip] = useState(null)
  const [position, setPosition] = useState({ center: [10, 0], zoom: 1.4 })
  const [geoData, setGeoData] = useState(null)

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error)
  }, [])

  // Mapa rápido: codigo → pais
  const paisMap = {}
  for (const p of paises) {
    paisMap[p.codigo] = p
  }

  const handleGeographyClick = useCallback(
    (geo) => {
      const numericId = String(geo.id)
      const alpha2 = COUNTRY_MAP[numericId]
      if (alpha2 && paisMap[alpha2]) {
        onSelectCountry(paisMap[alpha2])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paises, onSelectCountry]
  )

  const isGeographyActive = (geo) => {
    const numericId = String(geo.id)
    const alpha2 = COUNTRY_MAP[numericId]
    return alpha2 && !!paisMap[alpha2]
  }

  const getGeographyStatus = (geo) => {
    const numericId = String(geo.id)
    const alpha2 = COUNTRY_MAP[numericId]
    if (alpha2 && paisMap[alpha2]) {
      return getCountryStatus(paisMap[alpha2], config)
    }
    return null
  }

  return (
    <div className={styles.mapWrapper}>
      <ComposableMap
        projectionConfig={{ scale: 160 }}
        className={styles.map}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.center}
          onMoveEnd={setPosition}
          maxZoom={8}
        >
          {geoData && (
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const active = isGeographyActive(geo)
                  const status = active ? getGeographyStatus(geo) : null
                  const statusCfg = status ? STATUS_CONFIG[status] : null
                  const isSelected =
                    selectedCountry &&
                    COUNTRY_MAP[String(geo.id)] === selectedCountry.codigo

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleGeographyClick(geo)}
                      onMouseEnter={() => {
                        const numericId = String(geo.id)
                        const alpha2 = COUNTRY_MAP[numericId]
                        if (alpha2 && paisMap[alpha2]) {
                          setTooltip(paisMap[alpha2].nombre)
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: isSelected
                            ? statusCfg?.color || '#4B5563'
                            : active
                            ? statusCfg?.color + '60' || '#374151'
                            : '#1F2937',
                          stroke: isSelected
                            ? statusCfg?.color || '#6B7280'
                            : active
                            ? statusCfg?.color + 'AA' || '#374151'
                            : '#374151',
                          strokeWidth: isSelected ? 1.5 : active ? 0.8 : 0.3,
                          outline: 'none',
                          transition: 'fill 0.2s ease',
                          cursor: active ? 'pointer' : 'default',
                        },
                        hover: {
                          fill: active
                            ? statusCfg?.color || '#6B7280'
                            : '#2D3748',
                          stroke: active ? statusCfg?.color || '#6B7280' : '#4B5563',
                          strokeWidth: active ? 1 : 0.3,
                          outline: 'none',
                          cursor: active ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: statusCfg?.color || '#374151',
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          )}

          {/* Marcadores (dots) por ciudad */}
          {paises.map((pais) =>
            pais.municipios.map((municipio) => {
              const status = getCountryStatus(
                { municipios: [municipio] },
                config
              )
              const { color } = STATUS_CONFIG[status]
              const isSelected = selectedCountry?.codigo === pais.codigo

              return (
                <Marker
                  key={`${pais.codigo}-${municipio.ciudad}`}
                  coordinates={[municipio.lon, municipio.lat]}
                  onClick={() => onSelectCountry(pais)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={isSelected ? 3.5 : 2}
                    fill={color}
                    stroke="#0F172A"
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    style={{
                      filter: `drop-shadow(0 0 ${isSelected ? 4 : 2}px ${color})`,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {isSelected && (
                    <circle
                      r={6}
                      fill="none"
                      stroke={color}
                      strokeWidth={0.8}
                      strokeDasharray="2 1.5"
                      opacity={0.7}
                    />
                  )}
                </Marker>
              )
            })
          )}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div className={styles.tooltip}>{tooltip}</div>
      )}

      {/* Controles de zoom */}
      <div className={styles.zoomControls}>
        <button
          onClick={() =>
            setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))
          }
          title="Acercar"
        >
          +
        </button>
        <button
          onClick={() =>
            setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))
          }
          title="Alejar"
        >
          −
        </button>
        <button
          onClick={() => setPosition({ center: [10, 20], zoom: 1.4 })}
          title="Restablecer vista"
        >
          ⊙
        </button>
      </div>
    </div>
  )
})

WorldMap.displayName = 'WorldMap'
export default WorldMap
