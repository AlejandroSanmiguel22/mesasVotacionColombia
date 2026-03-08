/**
 * Retorna true si el municipio solo opera en domingo (no tiene 'Consulado' en el nombre).
 */
export function esSoloDomingo(ciudad) {
  return !ciudad.toLowerCase().includes('consulado')
}

/**
 * Calcula el estado de una mesa de votación basado en la hora local del timezone.
 *
 * Estados:
 *   'cerrada'         → Rojo    (antes o después del horario de votación)
 *   'pronto-abrir'   → Azul    (30 min antes de apertura)
 *   'abierta'         → Verde   (dentro del horario)
 *   'pronto-cerrar'  → Naranja (30 min antes del cierre)
 */
export function getMesaStatus(timezone, config = {}, soloDomingo = false, fechaInicio = null, esFuerzaMayor = false, fechaEleccion = null) {
  // Si está marcado como fuerza mayor, retornar directamente
  if (esFuerzaMayor) return 'fuerza-mayor'

  const {
    horaApertura = { hora: 8, minuto: 0 },
    horaCierre = { hora: 16, minuto: 0 },
    minutosAvisoApertura = 30,
    minutosAvisoCierre = 30,
  } = config

  try {
    const ahoraLocal = new Date(
      new Date().toLocaleString('en-US', { timeZone: timezone })
    )

    const hoyLocal = new Date(ahoraLocal.getFullYear(), ahoraLocal.getMonth(), ahoraLocal.getDate())

    // Si ya pasó la fecha de elección en este timezone → cerrada definitivamente
    if (fechaEleccion) {
      const eleccion = new Date(fechaEleccion + 'T00:00:00')
      if (hoyLocal > eleccion) return 'cerrada'
    }

    // Si solo opera en domingo y hoy no es domingo → cerrada
    if (soloDomingo && ahoraLocal.getDay() !== 0) {
      return 'cerrada'
    }

    // Si tiene fecha de inicio y aún no ha llegado → cerrada
    if (fechaInicio) {
      const inicio = new Date(fechaInicio + 'T00:00:00')
      if (hoyLocal < inicio) return 'cerrada'
    }

    const totalMinutos =
      ahoraLocal.getHours() * 60 + ahoraLocal.getMinutes()

    const minApertura = horaApertura.hora * 60 + horaApertura.minuto
    const minCierre = horaCierre.hora * 60 + horaCierre.minuto

    if (totalMinutos >= minCierre || totalMinutos < minApertura - minutosAvisoApertura) {
      return 'cerrada'
    } else if (totalMinutos < minApertura) {
      return 'pronto-abrir'
    } else if (totalMinutos >= minCierre - minutosAvisoCierre) {
      return 'pronto-cerrar'
    } else {
      return 'abierta'
    }
  } catch {
    return 'cerrada'
  }
}

/**
 * Retorna la hora local actual formateada para un timezone dado.
 */
export function getLocalTime(timezone) {
  try {
    return new Date().toLocaleTimeString('es-CO', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '--:--'
  }
}

/**
 * Retorna la configuración visual (color, etiqueta, icono) para cada estado.
 */
export const STATUS_CONFIG = {
  'pronto-abrir': {
    color: '#3B82F6',
    colorBg: 'rgba(59,130,246,0.15)',
    colorBorder: 'rgba(59,130,246,0.4)',
    label: 'Abre pronto',
    dot: '🔵',
    icon: '⏳',
    descripcion: 'La mesa abrirá en menos de 30 minutos',
  },
  abierta: {
    color: '#22C55E',
    colorBg: 'rgba(34,197,94,0.15)',
    colorBorder: 'rgba(34,197,94,0.4)',
    label: 'Abierta',
    dot: '🟢',
    icon: '✅',
    descripcion: 'Mesa en funcionamiento',
  },
  'pronto-cerrar': {
    color: '#F97316',
    colorBg: 'rgba(249,115,22,0.15)',
    colorBorder: 'rgba(249,115,22,0.4)',
    label: 'Cierra pronto',
    dot: '🟠',
    icon: '⚠️',
    descripcion: 'La mesa cerrará en menos de 30 minutos',
  },
  cerrada: {
    color: '#EF4444',
    colorBg: 'rgba(239,68,68,0.15)',
    colorBorder: 'rgba(239,68,68,0.4)',
    label: 'Cerrada',
    dot: '🔴',
    icon: '🔒',
    descripcion: 'La mesa está cerrada',
  },
  'fuerza-mayor': {
    color: '#A855F7',
    colorBg: 'rgba(168,85,247,0.15)',
    colorBorder: 'rgba(168,85,247,0.4)',
    label: 'Fuerza Mayor',
    dot: '🟣',
    icon: '⚡',
    descripcion: 'Mesa no disponible por situación extraordinaria',
  },
}

/**
 * Dado un país (con múltiples municipios y timezones), retorna el estado
 * más representativo para mostrar en el mapa (prioridad: abierta > pronto > cerrada).
 */
export function getCountryStatus(pais, config = {}, overrides = {}, fechaEleccion = null) {
  const prioridad = ['abierta', 'pronto-cerrar', 'pronto-abrir', 'fuerza-mayor', 'cerrada']
  let mejorEstado = 'cerrada'

  for (const municipio of pais.municipios) {
    const key = `${pais.codigo}-${municipio.ciudad}`
    const esFM = !!overrides[key]
    const estado = getMesaStatus(municipio.timezone, config, esSoloDomingo(municipio.ciudad), municipio.fechaInicio, esFM, fechaEleccion)
    if (
      prioridad.indexOf(estado) < prioridad.indexOf(mejorEstado)
    ) {
      mejorEstado = estado
    }
  }

  return mejorEstado
}
