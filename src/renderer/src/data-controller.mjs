/* eslint-disable @typescript-eslint/explicit-function-return-type -- Módulo JavaScript vanilla; no admite anotaciones de retorno TypeScript. */
/**
 * Adquisición de datos independiente del DOM, según ViewController.ts.
 * No calcula DPS, fama/h, porcentajes, medias, conteos ni tiempo de juego.
 * onChange solo pide a la vista pintar el recurso recibido.
 */
export function createCombatDataController(api, { onChange = () => {}, onError = () => {} } = {}) {
  const ui = { mapReady: false, section: 'Combate', advanced: false, player: null, interval: null }
  const resources = new Map()
  const subscriptions = []
  // El preload declara estas consultas, pero ViewController aún no tiene
  // ipcMain.handle para ellas. Mantener sus recursos como no disponibles.
  const missingMethods = new Set([
    'isBossMode',
    'getGroupTotals',
    'getPlayerDeaths',
    'getPlayerDpsHistory',
    'getPlayerAbilities'
  ])
  let generation = 0
  let started = false
  let disposed = false

  const playerKey = (kind, name, range = null) => JSON.stringify([kind, name, range])
  const scalar = (key, method) => ({ key, method, args: [], area: key })
  const perPlayer = (kind, method, name, range = null) => ({
    key: playerKey(kind, name, range),
    method,
    args: range ? [name, range] : [name],
    area: kind,
    player: name,
    range
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
      scalar('totals', 'getGroupTotals'),
      ...controls
    ]
    const names = getPlayerNames()
    for (const name of names) list.push(perPlayer('damage', 'getDamageAndDPS', name))
    if (ui.advanced && ui.player && names.includes(ui.player)) {
      list.push(perPlayer('deaths', 'getPlayerDeaths', ui.player))
      list.push(perPlayer('history', 'getPlayerDpsHistory', ui.player))
      list.push(perPlayer('abilities', 'getPlayerAbilities', ui.player))
      if (ui.interval)
        list.push(perPlayer('abilities', 'getPlayerAbilities', ui.player, ui.interval))
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
    const isCurrent = () =>
      !disposed && generation === token && resources.get(entry.key) === requested
    try {
      if (typeof api[entry.method] !== 'function') throw new Error('API_METHOD_UNAVAILABLE')
      const args = entry.area === 'history' ? [entry.player, entry.value?.cursor] : entry.args
      const incoming = await api[entry.method](...args)
      if (!isCurrent()) return
      if (entry.area === 'history' && incoming && !incoming.replace && entry.value) {
        // Solo ensamblar fragmentos recibidos. Main resuelve agregación y correcciones.
        entry.value = {
          ...incoming,
          points: [...entry.value.points, ...incoming.points],
          intervals: [...entry.value.intervals, ...incoming.intervals]
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

  function reconcileRoster() {
    const names = new Set(getPlayerNames())
    for (const [key, entry] of resources) {
      if (entry.player && !names.has(entry.player)) resources.delete(key)
    }
    if (ui.player && !names.has(ui.player)) {
      ui.player = null
      ui.interval = null
    }
  }

  function invalidate({ areas = [], playerNames, changedRange, reset = false }) {
    if (disposed) return
    if (reset) {
      generation++
      resources.clear()
      ui.interval = null
      onChange('reset')
    }
    // También después de reset: invalidar no depende de una carga anterior.
    ensureDemandedResources()
    for (const entry of resources.values()) {
      const area = ['paused', 'bossMode'].includes(entry.area) ? 'controls' : entry.area
      if (!areas.includes(area)) continue
      if (entry.player && playerNames && !playerNames.includes(entry.player)) continue
      if (
        entry.range &&
        changedRange &&
        (entry.range.toMs <= changedRange.fromMs || entry.range.fromMs >= changedRange.toMs)
      )
        continue
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

  function start() {
    if (started || disposed) return
    started = true
    ensureDemandedResources()
    subscribe('onMapLoad', (payload) => {
      if (payload?.data !== true) return
      activateMap()
      invalidate({ areas: ['players', 'localPlayer', 'time', 'fame', 'creditFame', 'damage', 'controls'] })
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
      ui.interval = null
      onChange('selection')
      return refresh()
    },
    selectInterval(range) {
      // El rango procede de un intervalo recibido de main, no se genera localmente.
      const value = range ? { fromMs: range.fromMs, toMs: range.toMs } : null
      if (JSON.stringify(ui.interval) === JSON.stringify(value)) return
      if (ui.interval) resources.delete(playerKey('abilities', ui.player, ui.interval))
      ui.interval = value
      onChange('interval')
      return refresh()
    },
    invalidate,
    // ViewController no emite combat-data-changed: los datos se consultan periódicamente.
    // El temporizador exterior consulta; nunca calcula ni incrementa el tiempo.
    pollLegacy() {
      return invalidate({
        areas: ['players', 'localPlayer', 'time', 'fame', 'creditFame', 'damage', 'controls']
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
