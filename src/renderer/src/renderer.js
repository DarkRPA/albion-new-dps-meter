/* eslint-disable @typescript-eslint/explicit-function-return-type -- Módulo JavaScript vanilla; no admite anotaciones de retorno TypeScript. */
import { createCombatDataController } from './data-controller.mjs'
import { fillIcons, icon } from './icons.mjs'

// Este archivo presenta los datos y envía acciones del usuario.
// data-controller.mjs se encarga de pedir y guardar las respuestas del back-end.
const root = document.getElementById('albion-nexus')
const api = window.mainApi
const node = (id) => document.getElementById(id)
const finite = (n) => typeof n === 'number' && Number.isFinite(n)
const exact = (n) => (finite(n) ? Math.round(n).toLocaleString('es-ES') : '—')
const fmt = (n) => {
  if (!finite(n)) return '—'
  if (Math.abs(n) >= 1000000)
    return (n / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' M'
  if (Math.abs(n) >= 1000)
    return (n / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' k'
  return exact(n)
}
// Formato exclusivamente visual: convierte los milisegundos recibidos a HH:MM:SS.
// No guarda tiempo, no consulta el reloj del equipo y no incrementa el valor.
const clock = (ms) => {
  if (!finite(ms) || ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
const percent = (value) =>
  finite(value) ? value.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' %' : '—'
// get-players devuelve string[]; get-localplayer devuelve string | undefined.
const roster = () => data.getPlayerNames()
const key = (area, name) => data.playerKey(area, name)
const valueFor = (area, name) => data.read(key(area, name))

let metric = 'damage'
let legacyBossRequested = false // Estado visual del último comando cuando main aún no expone isBossMode.
let scheduled = false
let noticeTimer
let pollTimer
let graphObserver

function put(id, html) {
  const element = node(id)
  if (element && element.innerHTML !== html) element.innerHTML = html
}

function feedback(text) {
  clearTimeout(noticeTimer)
  node('feedback').textContent = text
  node('feedback').hidden = !text
  if (text)
    noticeTimer = setTimeout(() => {
      node('feedback').hidden = true
    }, 5000)
}

function chooseDefaultPlayer() {
  const ui = data.getView()
  if (!ui.advanced || ui.player) return
  const players = roster()
  const local = data.read('localPlayer')
  const candidate = players.find((name) => name === local) || players[0]
  if (candidate) data.selectPlayer(candidate)
}

// Agrupar respuestas que llegan juntas en un único repintado del navegador.
// requestAnimationFrame no es un reloj de sesión ni solicita nuevos datos.
function scheduleRender() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

const data = createCombatDataController(api || {}, {
  onChange(resource) {
    // Política de selección tras recibir datos; render() solo dibuja.
    if (['players', 'localPlayer'].includes(resource)) chooseDefaultPlayer()
    scheduleRender(resource)
  },
  onError(resource, error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/No handler registered|API_METHOD_UNAVAILABLE/.test(message)) return
    console.error(`No se pudo leer ${resource}:`, error)
    feedback('No se han podido actualizar algunos datos. Se conservan los últimos recibidos.')
  }
})

function png(url, label, placeholder, className = 'player-portrait') {
  let source = ''
  if (typeof url === 'string' && url.trim()) {
    try {
      const parsed = new URL(url, window.location.href)
      if (
        ['http:', 'https:', 'file:'].includes(parsed.protocol) ||
        /^data:image\/(png|jpeg|webp|gif);base64,/i.test(url)
      )
        source = parsed.href
    } catch {
      /* URL ausente o inválida: mostrar marcador. */
    }
  }
  return `<span class="${className}"><span class="image-placeholder" aria-hidden="true">${esc(placeholder)}</span>${source ? `<img src="${esc(source)}" alt="${esc(label)}" />` : ''}</span>`
}

function emptyResource(resource, text) {
  const status = data.status(resource)
  const message =
    status === 'error'
      ? 'No se pudieron cargar estos datos.'
      : status === 'unavailable'
        ? text
        : 'Cargando…'
  return `<p class="skills-empty">${esc(message)}</p>`
}

// Orden y aporte visual calculados con los últimos totales recibidos de main.
// Los jugadores sin datos quedan al final y muestran un aporte no disponible.
// Main representa la curación con signo negativo. Solo para mostrarla usamos
// su magnitud; la caché y los valores originales del back-end no se modifican.
const healingMagnitude = (value) => finite(value) ? Math.abs(value) : null

function rankedPlayers() {
  const players = roster().map((name) => {
    const stats = valueFor('damage', name)
    const amount = metric === 'healing' ? healingMagnitude(stats?.healing) : stats?.damage
    const rate = metric === 'healing' ? healingMagnitude(stats?.hps) : stats?.dps
    return { name, stats, amount: finite(amount) ? amount : null, rate }
  })
  const total = players.reduce((sum, player) => sum + (player.amount ?? 0), 0)
  players.sort((a, b) => {
    if (a.amount === null) return b.amount === null ? 0 : 1
    if (b.amount === null) return -1
    return b.amount - a.amount
  })
  return players.map((player) => ({
    ...player,
    share: player.amount === null ? undefined : total > 0 ? (player.amount / total) * 100 : 0
  }))
}

function playerTable(ui) {
  const players = rankedPlayers()
  if (!players.length) {
    return data.status('players') === 'ready'
      ? '<p class="skills-empty">Esperando jugadores…</p>'
      : emptyResource('players', 'La lista de jugadores no está disponible.')
  }
  const local = data.read('localPlayer')
  return `<div class="table-scroll"><table aria-label="Estadísticas del grupo"><thead><tr><th>JUGADOR / ARMA</th><th>${metric === 'damage' ? 'DAÑO' : 'CURACIÓN'}</th><th>APORTE</th><th>${metric === 'damage' ? 'DPS' : 'HPS'}</th></tr></thead><tbody>${players
    .map(({ name, stats, amount, rate, share }) => {
      const bar = metric === 'damage' ? stats?.damageBarPercent : stats?.healingBarPercent
      const button = ui.advanced ? 'button' : 'span'
      const attrs = ui.advanced
        ? `data-player="${esc(name)}" aria-pressed="${ui.player === name}"`
        : ''
      const weapon = stats?.weaponName
      return `<tr class="${ui.advanced && ui.player === name ? 'selected' : ''}"><td>${finite(bar) ? `<span class="damage-bar" style="width:${Math.max(0, Math.min(100, bar))}%"></span>` : ''}<div class="player-name">${png(stats?.weaponImage, `Arma de ${name}`, name.slice(0, 2).toUpperCase())}<${button} ${attrs}>${esc(name)}${name === local ? '<span class="muted small"> · Tú</span>' : ''}${ui.advanced && weapon ? `<small class="weapon-label muted">${esc(weapon)}</small>` : ''}</${button}></div></td><td>${fmt(amount)}</td><td class="muted">${percent(share)}</td><td>${fmt(rate)}${finite(rate) ? '/s' : ''}</td></tr>`
    })
    .join('')}</tbody></table></div>`
}

function inspector(ui) {
  if (!ui.player) return '<p class="skills-empty">Selecciona un jugador.</p>'
  const p = valueFor('damage', ui.player)
  const deaths = valueFor('deaths', ui.player)
  return `<span class="eyebrow">Detalle del jugador</span>${png(p?.weaponImage, `Arma de ${ui.player}`, ui.player.slice(0, 2).toUpperCase())}<h2>${esc(ui.player)}</h2>${p?.weaponName ? `<p class="muted small">${esc(p.weaponName)}</p>` : ''}<div class="detail-stat"><span>Daño infligido</span><strong class="gold">${fmt(p?.damage)}</strong></div><div class="detail-stat"><span>Curación total</span><strong class="green">${fmt(healingMagnitude(p?.healing))}</strong></div><div class="detail-stat"><span>DPS promedio</span><strong>${exact(p?.dps)}</strong></div><div class="detail-stat death-count"><span>${icon('skull')}Muertes</span><strong class="red">${exact(deaths?.length)}</strong></div>${deaths ? `<p class="death-times">${deaths.length ? deaths.map((d) => clock(d.timestamp)).join(' · ') : 'Sin muertes registradas'}</p>` : '<p class="muted small">Datos de muertes no disponibles.</p>'}`
}

function abilityTable(result, resource) {
  if (!result) return emptyResource(resource, 'Datos de habilidades no disponibles.')
  // Main devuelve un diccionario por uniqueName, no un array ni una clase Spell.
  // Orden visual descendente; los valores de daño se conservan tal como llegan.
  const abilities = Object.entries(result).sort(([, a], [, b]) => b.damage - a.damage)
  if (!abilities.length)
    return '<p class="skills-empty">Sin habilidades ni impactos registrados en esta sesión.</p>'
  const rows = abilities.map(([uniqueName, ability]) => {
    const name = ability.localization || uniqueName
    return `<tr><td>${png(ability.urlIcon, name, name.slice(0, 1).toUpperCase(), 'skill-portrait')}</td><td>${esc(name)}</td><td>${exact(ability.ticks)}</td><td class="gold">${exact(ability.damage)}</td></tr>`
  }).join('')
  return `<div class="table-scroll"><table class="ability-table" aria-label="Daño por habilidad"><thead><tr><th><span class="sr-label">Icono</span></th><th>Habilidad</th><th>Impactos</th><th>Daño total</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function evolution(ui, history, deaths) {
  if (!history) return emptyResource(key('history', ui.player), 'Historial de DPS no disponible.')
  if (!history.points.length) return '<p class="skills-empty">Aún no hay muestras de DPS.</p>'
  return `<div class="evolution" role="group" aria-label="Evolución de ${esc(ui.player)}"><div class="evolution-plot"><svg class="dps-line" role="img" aria-label="Gráfico de barras del DPS promedio"></svg><div class="y-labels" aria-hidden="true"></div><div class="graph-targets"></div></div><div class="evolution-axis"></div></div><div class="chart-legend"><span><i class="legend-gold"></i>DPS promedio</span><span class="red">${icon('skull')}Muerte${deaths ? '' : ' · sin datos'}</span><span class="muted">Tiempo de sesión</span></div>`
}

function breakdown(ui) {
  if (!ui.player) return ''
  const history = valueFor('history', ui.player)
  const deaths = valueFor('deaths', ui.player)
  const skills = valueFor('abilities', ui.player)
  return `<div class="session-strip"><h3>Evolución · ${esc(ui.player)}</h3><span>DPS promedio</span></div>${evolution(ui, history, deaths)}<section class="global-skills"><div class="heading"><div><span class="eyebrow">Detalle del jugador / ${esc(ui.player)}</span><h3>Daño por habilidad <span class="muted small">· Sesión completa</span></h3></div></div>${abilityTable(skills, key('abilities', ui.player))}<p class="skills-note">Impactos corresponde a los ticks de daño registrados por el back-end.</p></section>`
}

// Traducir muestras a coordenadas SVG. Las divisiones calculan posiciones y tamaños
// de barras; no recalculan DPS ni tiempo de juego. elapsedMs y averageDps vienen de main.
function drawGraph() {
  const ui = data.getView()
  const plot = root.querySelector('.evolution-plot')
  if (!plot || !ui.player || !ui.advanced) return
  const history = valueFor('history', ui.player)
  if (!history?.points.length) return
  const deaths = valueFor('deaths', ui.player) || []
  // Solo geometría de presentación: cada barra representa una muestra de main.
  const width = plot.clientWidth,
    height = 150
  if (!width) return
  // El contador y el eje comparten exclusivamente el reloj recibido de main.
  const endMs = data.read('time')
  const svg = plot.querySelector('svg')
  if (!finite(endMs) || endMs < 0) {
    svg.innerHTML = ''
    plot.querySelector('.y-labels').innerHTML = ''
    plot.querySelector('.graph-targets').innerHTML = ''
    plot.parentElement.querySelector('.evolution-axis').textContent = 'Esperando tiempo de sesión…'
    return
  }
  const scaleMs = endMs || 1 // Evitar división por cero sin alterar el tiempo mostrado.
  const points = history.points.filter((p) =>
    finite(p.elapsedMs) && p.elapsedMs >= 0 && p.elapsedMs <= endMs && finite(p.averageDps)
  )
  const ceiling = Math.max(1, ...points.map((p) => p.averageDps)) * 1.1
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const ordered = [...points].sort((a, b) => a.elapsedMs - b.elapsedMs)
  const bars = ordered.map((p, i) => {
    const x = (p.elapsedMs / scaleMs) * width
    const previousGap = i > 0 ? ((p.elapsedMs - ordered[i - 1].elapsedMs) / scaleMs) * width : Infinity
    const nextGap = i + 1 < ordered.length ? ((ordered[i + 1].elapsedMs - p.elapsedMs) / scaleMs) * width : Infinity
    // El ancho es visual; no representa un intervalo de daño.
    const barWidth = Math.min(width, 18, Math.max(0.5, Math.min(previousGap, nextGap) * 0.8))
    const barHeight = Math.max(0, (p.averageDps / ceiling) * height)
    const left = Math.max(0, Math.min(width - barWidth, x - barWidth / 2))
    return `<rect x="${left}" y="${height - barHeight}" width="${barWidth}" height="${barHeight}" fill="var(--gold)"><title>${esc(clock(p.elapsedMs))} (${p.elapsedMs} ms) · ${esc(exact(p.averageDps))} DPS</title></rect>`
  }).join('')
  svg.innerHTML = `<title>DPS promedio por muestra de ${esc(ui.player)}</title>${[0, 0.5, 1].map((f) => `<line x1="0" x2="${width}" y1="${height * f}" y2="${height * f}" class="evolution-grid"/>`).join('')}${bars}`
  plot.querySelector('.y-labels').innerHTML = [ceiling, ceiling / 2, 0]
    .map((n, i) => `<span style="top:${28 + (i * height) / 2}px">${fmt(n)}</span>`)
    .join('')
  const targets =
    deaths
      .map((d, i) => ({ ...d, sourceIndex: i }))
      .filter((d) => finite(d.timestamp) && d.timestamp >= 0 && d.timestamp <= endMs)
      .map(
        (d) =>
          `<span class="death-mark" style="left:${(d.timestamp / scaleMs) * 100}%"><button data-death="${d.sourceIndex}" aria-label="Muerte en ${clock(d.timestamp)}.">${icon('skull')}</button></span>`
      )
      .join('')
  const targetNode = plot.querySelector('.graph-targets')
  if (targetNode.innerHTML !== targets) targetNode.innerHTML = targets
  plot.parentElement.querySelector('.evolution-axis').innerHTML = [
    0,
    endMs / 3,
    (endMs * 2) / 3,
    endMs
  ]
    .map((n) => `<span>${clock(n)}</span>`)
    .join('')
}

// Leer los últimos valores de la caché y escribirlos en el DOM.
// Si main devuelve el mismo tiempo, el contador muestra el mismo tiempo.
function render() {
  const ui = data.getView()
  node('no-map-screen').hidden = ui.mapReady || ui.section !== 'Combate'
  node('copy-fallback').hidden = ui.section !== 'Combate' || !ui.mapReady || node('copy-fallback').hidden
  const main = root.querySelector('main')
  const scrollPanel = ui.section === 'Combate' ? node('combat-scroll') : node('settings-view')
  const scroll = scrollPanel.scrollTop
  const focused = document.activeElement
  const focusKey = ['data-player', 'data-death', 'data-action'].find(
    (k) => main.contains(focused) && focused.hasAttribute(k)
  )
  const focusValue = focusKey && focused.getAttribute(focusKey)
  node('combat-view').hidden = ui.section !== 'Combate' || !ui.mapReady
  node('settings-view').hidden = ui.section !== 'Ajustes'
  root.querySelectorAll('[data-section]').forEach((b) => {
    b.classList.toggle('active', b.dataset.section === ui.section)
    b.setAttribute('aria-pressed', b.dataset.section === ui.section)
  })
  const advanced = root.querySelector('[data-action="advanced"]')
  advanced.classList.toggle('active', ui.advanced)
  advanced.setAttribute('aria-pressed', ui.advanced)
  node('players-layout').classList.toggle('basic-grid', !ui.advanced)
  node('player-inspector').hidden = !ui.advanced
  node('player-breakdown').hidden = !ui.advanced
  if (ui.section === 'Combate' && ui.mapReady) {
    node('el-timer').textContent = clock(data.read('time'))
    node('el-fame').textContent = fmt(data.read('fame'))
    node('el-credit').textContent = fmt(data.read('creditFame'))
    node('el-count').textContent = roster().length ? `/ ${roster().length} jugadores` : ''
    put('players-table', playerTable(ui))
    if (ui.advanced) {
      put('player-inspector', inspector(ui))
      put('player-breakdown', breakdown(ui))
      graphObserver?.disconnect()
      drawGraph()
      const plot = root.querySelector('.evolution-plot')
      if (plot) {
        graphObserver = new ResizeObserver(drawGraph)
        graphObserver.observe(plot)
      }
    }
  }
  const boss = data.read('bossMode') ?? legacyBossRequested
  const paused = data.read('paused')
  node('boss-banner').hidden = !boss
  root.querySelector('[data-action="boss"]').setAttribute('aria-pressed', boss)
  root.querySelector('[data-action="reset"]').disabled = boss
  root.querySelector('[data-action="pause"]').disabled = boss || typeof paused !== 'boolean'
  root.querySelector('[data-action="copy"]').disabled = !roster().length
  node('pause-label').textContent = paused ? 'Reanudar' : 'Pausar'
  root.querySelector('[data-action="pause"] [data-icon]').innerHTML = icon(
    paused ? 'play' : 'pause'
  )
  node('el-status').textContent = paused
    ? 'Pausado'
    : typeof paused === 'boolean'
      ? 'Activo'
      : 'Cargando…'
  if (focusKey && !document.contains(focused)) {
    Array.from(main.querySelectorAll(`[${focusKey}]`))
      .find((el) => el.getAttribute(focusKey) === focusValue)
      ?.focus({ preventScroll: true })
  }
  scrollPanel.scrollTop = scroll
}

async function copyData() {
  const text =
    `Jugador | ${metric === 'damage' ? 'Daño | DPS' : 'Curación | HPS'} | Aporte\n` +
    rankedPlayers()
      .map(({ name, amount, rate, share }) =>
        `${name} | ${exact(amount)} | ${exact(rate)} | ${percent(share)}`
      )
      .join('\n')
  try {
    await navigator.clipboard.writeText(text)
    feedback('Resumen copiado')
  } catch {
    node('copy-fallback').hidden = false
    node('copy-text').value = text
    node('copy-text').focus()
    node('copy-text').select()
  }
}

root.addEventListener('click', async (event) => {
  const button = event.target.closest('button')
  if (!button || !root.contains(button) || button.disabled) return
  if (button.dataset.section) {
    data.setSection(button.dataset.section)
    return
  }
  if (!data.getView().mapReady || data.getView().section !== 'Combate') return
  if (button.dataset.metric) {
    metric = button.dataset.metric
    root.querySelectorAll('[data-metric]').forEach((b) => {
      b.classList.toggle('active', b.dataset.metric === metric)
      b.setAttribute('aria-pressed', b.dataset.metric === metric)
    })
    scheduleRender('metric')
    return
  }
  if (button.dataset.player) {
    data.selectPlayer(button.dataset.player)
    return
  }
  if (button.hasAttribute('data-death')) {
    const player = data.getView().player
    const death = valueFor('deaths', player)?.[Number(button.dataset.death)]
    feedback(death ? `Muerte en ${clock(death.timestamp)}.${death.causanteNombre ? ` Causante: ${death.causanteNombre}.` : ''}` : 'Datos de muerte no disponibles.')
    return
  }
  try {
    switch (button.dataset.action) {
      case 'advanced':
        data.setAdvanced(!data.getView().advanced)
        chooseDefaultPlayer()
        break
      case 'pause':
        if (data.read('paused')) api.sendUnpause()
        else api.sendPause()
        data.invalidate({ areas: ['controls', 'time', 'damage'] })
        break
      case 'boss':
        legacyBossRequested = !(data.read('bossMode') ?? legacyBossRequested)
        if (data.read('paused')) api.sendUnpause()
        api.sendBossMode(legacyBossRequested)
        data.invalidate({ reset: true })
        break
      case 'reset':
        if (data.read('paused')) api.sendUnpause()
        api.sendReset()
        data.invalidate({ reset: true })
        break
      case 'copy':
        await copyData()
        break
      case 'close-copy':
        node('copy-fallback').hidden = true
        break
    }
  } catch (error) {
    console.error(error)
    feedback('No se ha podido enviar la acción al back-end.')
  }
})

// Preferencia visual local: no modifica los datos ni consulta el back-end.
const defaultAccent = '#d2ae56'
const accentStorageKey = 'albion-nexus-accent'
function applyAccent(hex, persist = true) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
  root.style.setProperty('--gold', hex)
  root.style.setProperty('--accent-rgb', rgb.join(', '))
  node('accent-color').value = hex
  node('accent-hex').value = hex.toUpperCase()
  node('accent-hex').setCustomValidity('')
  ;['r', 'g', 'b'].forEach((channel, i) => { node(`accent-${channel}`).value = rgb[i] })
  root.querySelectorAll('[data-accent]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.accent === hex.toLowerCase()))
  })
  if (persist) {
    try { localStorage.setItem(accentStorageKey, hex) } catch { /* Preferencia disponible durante esta sesión. */ }
  }
}
node('accent-color').addEventListener('input', (event) => applyAccent(event.target.value))
node('accent-hex').addEventListener('change', (event) => {
  const hex = event.target.value.trim()
  if (/^#[0-9a-f]{6}$/i.test(hex)) applyAccent(hex)
  else {
    event.target.setCustomValidity('Introduce un color HEX de seis cifras, por ejemplo #69A9FF.')
    event.target.reportValidity()
  }
})
;['r', 'g', 'b'].forEach((channel) => {
  node(`accent-${channel}`).addEventListener('input', () => {
    const fields = ['r', 'g', 'b'].map((c) => node(`accent-${c}`))
    if (fields.some((field) => field.value === '' || !field.validity.valid)) return
    applyAccent('#' + fields.map((field) => Number(field.value).toString(16).padStart(2, '0')).join(''))
  })
})
root.querySelectorAll('[data-accent]').forEach((button) => {
  button.addEventListener('click', () => applyAccent(button.dataset.accent))
})
node('reset-accent').addEventListener('click', () => applyAccent(defaultAccent))
let savedAccent = defaultAccent
try { savedAccent = localStorage.getItem(accentStorageKey) || defaultAccent } catch { /* Usar el color inicial. */ }
applyAccent(/^#[0-9a-f]{6}$/i.test(savedAccent) ? savedAccent : defaultAccent, false)
scheduleRender()

node('compact-rows').addEventListener('change', (event) =>
  root.classList.toggle('compact', event.target.checked)
)
root.addEventListener(
  'error',
  (event) => {
    if (event.target.tagName === 'IMG') event.target.remove()
  },
  true
)
fillIcons(root)
if (!api) {
  node('connection-error').hidden = false
  node('connection-error').textContent =
    'No se ha podido conectar con la aplicación. Abre el medidor desde Electron.'
} else {
  data.start()
  // Frecuencia de consultas, no contador de sesión: cada segundo pedimos datos.
  // El tiempo mostrado solo cambia cuando getProgramTiming devuelve otro valor.
  // La pausa y el reinicio del tiempo son responsabilidad del back-end.
  pollTimer = setInterval(() => data.pollLegacy(), 1000)
}
window.addEventListener('beforeunload', () => {
  clearInterval(pollTimer)
  clearTimeout(noticeTimer)
  graphObserver?.disconnect()
  data.dispose()
})
