/* eslint-disable @typescript-eslint/explicit-function-return-type -- Módulo JavaScript vanilla; no admite anotaciones de retorno TypeScript. */
/**
 * Adquisición de datos independiente del DOM, según ViewController.ts.
 * No calcula DPS, fama/h, porcentajes, medias, conteos ni tiempo de juego.
 * Recorrido de una actualización:
 * evento de main o pollLegacy → invalidate → refresh → load → getter del preload.
 * La respuesta se guarda en resources y onChange solicita repintar la vista.
 * render() consulta esa caché mediante read(); no solicita datos al back-end.
 *
 * Ejemplo: el recurso "time" llama a getProgramTiming(). Su value es exactamente
 * la respuesta de main; aquí no se incrementa, se pausa ni se estima ese valor.
 */
export function createCombatDataController(api, { onChange = () => {}, onError = () => {} } = {}) {
  const ui = { mapReady: false, section: 'Combate', advanced: false, player: null }
  // Una entrada por dato global o por combinación de jugador y tipo de dato.
  // value: última respuesta; status: estado de carga para la interfaz.
  // dirty: hay que volver a consultar; inFlight: ya hay una petición pendiente.
  // dirty e inFlight pueden ser true a la vez si llega un aviso mientras se consulta.
  const resources = new Map()
  const subscriptions = []
  // El preload declara estas consultas, pero ViewController aún no tiene
  // ipcMain.handle para ellas. Mantener sus recursos como no disponibles.
  const missingMethods = new Set([
    'isBossMode',
    'getGroupTotals',
  ])
  // Cambia al reiniciar o cerrar. Las respuestas de la generación anterior
  // se descartan para que una petición antigua no restaure datos ya reiniciados.
  let generation = 0
  let started = false
  let disposed = false

  // Una clave identifica el tipo de dato y el jugador al que pertenece.
  const playerKey = (kind, name) => JSON.stringify([kind, name])
  const scalar = (key, method) => ({ key, method, args: [], area: key })
  const perPlayer = (kind, method, name) => ({
    key: playerKey(kind, name),
    method,
    args: [name],
    area: kind,
    player: name
  })

  // La lista visible incluye al local aunque no esté entre los miembros del grupo.
  // Ambas fuentes proceden del back-end; esta lectura no ejecuta IPC.
  function getPlayerNames() {
    const players = resources.get('players')?.value
    const local = resources.get('localPlayer')?.value
    const names = new Set(Array.isArray(players) ? players : [])
    if (typeof local === 'string' && local.length > 0) names.add(local)
    return [...names]
  }

  // Describe qué datos necesita la pantalla actual, sin ejecutar sus getters.
  // La vista avanzada solo demanda el historial del jugador seleccionado.
  function demanded() {
    // Los controles siguen visibles en el pie incluso dentro de Ajustes.
    const controls = [scalar('paused', 'isPaused'), scalar('bossMode', 'isBossMode')]
    if (ui.section !== 'Combate') return controls
    const list = [
      scalar('players', 'getPlayers'),
      scalar('localPlayer', 'getLocalPlayer'),
      scalar('time', 'getProgramTiming'),
      scalar('fame', 'getFame'),
      scalar('creditFame', 'getCrediFame'),
      ...controls
    ]
    const names = getPlayerNames()
    for (const name of names) list.push(perPlayer('damage', 'getDamageAndDPS', name))
    if (ui.advanced && ui.player && names.includes(ui.player)) {
      list.push(perPlayer('deaths', 'getPlayerDeaths', ui.player))
      list.push(perPlayer('history', 'getPlayerDpsHistory', ui.player))
      list.push(perPlayer('abilities', 'getPlayerAbilities', ui.player))
    }
    return list
  }

  // Registrar recursos no ejecuta IPC: pueden existir antes del cambio de zona.
  function ensureDemandedResources() {
    return demanded().map((spec) => {
      let entry = resources.get(spec.key)
      if (!entry) {
        const missing = missingMethods.has(spec.method)
        entry = {
          ...spec,
          value: undefined,
          status: missing ? 'unavailable' : 'idle',
          dirty: !missing,
          inFlight: false
        }
        resources.set(spec.key, entry)
      }
      return entry
    })
  }

  // Cada invalidación despacha las consultas aquí, sin depender de render ni de
  // una microtarea. load marca inFlight antes del primer await para no duplicarlas.
  function refresh() {
    if (disposed || !started || !ui.mapReady) return Promise.resolve([])
    const requests = []
    for (const entry of ensureDemandedResources()) {
      if (entry.dirty && !entry.inFlight && !missingMethods.has(entry.method)) {
        requests.push(load(entry))
      }
    }
    return Promise.allSettled(requests)
  }

  async function load(entry) {
    const token = generation
    const requested = entry
    entry.inFlight = true
    entry.dirty = false
    entry.status = 'loading'
    // También comprobar la identidad de la entrada: puede haberse eliminado
    // porque el jugador salió y recreado con la misma clave antes de responder.
    const isCurrent = () =>
      !disposed && generation === token && resources.get(entry.key) === requested
    try {
      if (typeof api[entry.method] !== 'function') throw new Error('API_METHOD_UNAVAILABLE')
      const args = entry.area === 'history' ? [entry.player, entry.value?.cursor] : entry.args
      // Único punto de consulta al preload. Por ejemplo:
      // method="getDamageAndDPS", args=["Jugador"] → api.getDamageAndDPS("Jugador").
      const incoming = await api[entry.method](...args)
      if (!isCurrent()) return
      if (entry.area === 'history' && incoming) {
        // Cada punto conserva el elapsedMs y averageDps recibidos de main.
        // No generar ni ensamblar intervalos entre muestras.
        entry.value = {
          cursor: incoming.cursor,
          replace: incoming.replace,
          points: incoming.replace || !entry.value
            ? incoming.points
            : [...entry.value.points, ...incoming.points],
        }
      } else {
        entry.value = incoming
      }
      entry.status = incoming == null ? 'unavailable' : 'ready'
      if (entry.key === 'players' || entry.key === 'localPlayer') reconcileRoster()
      onChange(entry.key)
    } catch (error) {
      if (!isCurrent()) return
      const message = error instanceof Error ? error.message : String(error)
      const missing = message === 'API_METHOD_UNAVAILABLE' || /No handler registered/i.test(message)
      // Un handler puede no estar registrado todavía al arrancar main.
      // No bloquear permanentemente un getter existente por un fallo de IPC.
      if (message === 'API_METHOD_UNAVAILABLE') missingMethods.add(entry.method)
      entry.status = missing ? 'unavailable' : 'error'
      onError(entry.key, error)
      onChange(entry.key)
    } finally {
      if (isCurrent()) {
        entry.inFlight = false
        // Al recibir players aparecen las consultas get-damage de sus miembros.
        // Si hubo otra invalidación en vuelo, dirty provoca una nueva consulta.
        refresh()
      }
    }
  }

  // Eliminar datos y selección de jugadores que ya no están en ninguna fuente.
  function reconcileRoster() {
    const names = new Set(getPlayerNames())
    for (const [key, entry] of resources) {
      if (entry.player && !names.has(entry.player)) resources.delete(key)
    }
    if (ui.player && !names.has(ui.player)) {
      ui.player = null
    }
  }

  // Invalidar conserva value: solo marca los datos para volver a solicitarlos.
  // reset=true es la excepción: vacía la caché e invalida respuestas anteriores.
  // areas selecciona tipos de datos; playerNames limita los jugadores afectados.
  // refresh carga lo visible; los datos ocultos quedan pendientes hasta mostrarse.
  function invalidate({ areas = [], playerNames, reset = false }) {
    if (disposed) return
    if (reset) {
      generation++
      resources.clear()
      onChange('reset')
    }
    // También después de reset: invalidar no depende de una carga anterior.
    ensureDemandedResources()
    for (const entry of resources.values()) {
      const area = ['paused', 'bossMode'].includes(entry.area) ? 'controls' : entry.area
      if (!areas.includes(area)) continue
      if (entry.player && playerNames && !playerNames.includes(entry.player)) continue
      entry.dirty = !missingMethods.has(entry.method)
    }
    return refresh()
  }

  function activateMap() {
    if (disposed || ui.mapReady) return
    ui.mapReady = true
    onChange('mapReady')
  }

  function subscribe(method, callback) {
    if (typeof api[method] !== 'function') return
    const unsubscribe = api[method](callback)
    if (typeof unsubscribe === 'function') subscriptions.push(unsubscribe)
  }

  // Instalar los avisos una sola vez. Registrar recursos no desbloquea el medidor:
  // refresh espera a que mapa-cargado confirme el cambio de zona.
  function start() {
    if (started || disposed) return
    started = true
    ensureDemandedResources()
    subscribe('onMapLoad', (payload) => {
      if (payload?.data !== true) return
      activateMap()
      invalidate({ areas: ['players', 'localPlayer', 'time', 'fame', 'creditFame', 'damage', 'history', 'deaths', 'abilities', 'controls'] })
    })
    // Los eventos envían el nombre; la lista y las estadísticas vienen de sus getters.
    subscribe('onPlayerAdded', (playerName) =>
      invalidate({ areas: ['players', 'localPlayer', 'damage'], playerNames: [playerName] })
    )
    subscribe('onPlayerRemoved', () => invalidate({ areas: ['players', 'localPlayer'] }))
    subscribe('onLocalPlayerLeave', () => invalidate({ areas: ['players', 'localPlayer'] }))
    // is-map-loaded está registrado con ipcMain.on y no responde a invoke.
    // Hasta que exista su handle, solo mapa-cargado confirma el cambio de zona.
  }

  return {
    start,
    getView: () => ({ ...ui }),
    getPlayerNames,
    // Leer para pintar nunca ejecuta IPC.
    read(key) {
      return resources.get(key)?.value
    },
    status(key) {
      return resources.get(key)?.status ?? 'idle'
    },
    playerKey,
    setSection(section) {
      if (!['Combate', 'Ajustes'].includes(section) || ui.section === section) return
      ui.section = section
      onChange('section')
      return refresh()
    },
    setAdvanced(active) {
      if (ui.advanced === active) return
      ui.advanced = active
      onChange('advanced')
      return refresh()
    },
    selectPlayer(name) {
      if (ui.player === name) return
      ui.player = name
      onChange('selection')
      return refresh()
    },
    invalidate,
    // ViewController no emite combat-data-changed: los datos se consultan periódicamente.
    // El temporizador exterior consulta; nunca calcula ni incrementa el tiempo.
    pollLegacy() {
      return invalidate({
        areas: ['players', 'localPlayer', 'time', 'fame', 'creditFame', 'damage', 'history', 'deaths', 'abilities', 'controls']
      })
    },
    dispose() {
      if (disposed) return
      disposed = true
      generation++
      subscriptions.forEach((unsubscribe) => unsubscribe())
      resources.clear()
    }
  }
}
