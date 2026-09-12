/* eslint-disable @typescript-eslint/explicit-function-return-type -- Módulo JavaScript vanilla; no admite anotaciones de retorno TypeScript. */
import { createCombatDataController } from './data-controller.mjs'
import { fillIcons, icon } from './icons.mjs'

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
const key = (area, name, range) => data.playerKey(area, name, range)
const valueFor = (area, name, range) => data.read(key(area, name, range))

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

function playerTable(ui) {
  const players = roster()
  if (!players.length) {
    return data.status('players') === 'ready'
      ? '<p class="skills-empty">Esperando jugadores…</p>'
      : emptyResource('players', 'La lista de jugadores no está disponible.')
  }
  const local = data.read('localPlayer')
  return `<div class="table-scroll"><table aria-label="Estadísticas del grupo"><thead><tr><th>JUGADOR / ARMA</th><th>${metric === 'damage' ? 'DAÑO' : 'CURACIÓN'}</th><th>APORTE</th><th>${metric === 'damage' ? 'DPS' : 'HPS'}</th></tr></thead><tbody>${players
    .map((name) => {
      const stats = valueFor('damage', name)
      const share = metric === 'damage' ? stats?.damageSharePercent : stats?.healingSharePercent
      const bar = metric === 'damage' ? stats?.damageBarPercent : stats?.healingBarPercent
      const button = ui.advanced ? 'button' : 'span'
      const attrs = ui.advanced
        ? `data-player="${esc(name)}" aria-pressed="${ui.player === name}"`
        : ''
      const weapon = stats?.weaponName
      return `<tr class="${ui.advanced && ui.player === name ? 'selected' : ''}"><td>${finite(bar) ? `<span class="damage-bar" style="width:${Math.max(0, Math.min(100, bar))}%"></span>` : ''}<div class="player-name">${png(stats?.weaponImage, `Arma de ${name}`, name.slice(0, 2).toUpperCase())}<${button} ${attrs}>${esc(name)}${name === local ? '<span class="muted small"> · Tú</span>' : ''}${ui.advanced && weapon ? `<small class="weapon-label muted">${esc(weapon)}</small>` : ''}</${button}></div></td><td>${fmt(stats?.[metric])}</td><td class="muted">${percent(share)}</td><td>${fmt(metric === 'damage' ? stats?.dps : stats?.hps)}${finite(metric === 'damage' ? stats?.dps : stats?.hps) ? '/s' : ''}</td></tr>`
    })
    .join('')}</tbody></table></div>`
}

function inspector(ui) {
  if (!ui.player) return '<p class="skills-empty">Selecciona un jugador.</p>'
  const p = valueFor('damage', ui.player)
  const deaths = valueFor('deaths', ui.player)
  return `<span class="eyebrow">Detalle del jugador</span>${png(p?.weaponImage, `Arma de ${ui.player}`, ui.player.slice(0, 2).toUpperCase())}<h2>${esc(ui.player)}</h2>${p?.weaponName ? `<p class="muted small">${esc(p.weaponName)}</p>` : ''}<div class="detail-stat"><span>Daño infligido</span><strong class="gold">${fmt(p?.damage)}</strong></div><div class="detail-stat"><span>Curación total</span><strong class="green">${fmt(p?.healing)}</strong></div><div class="detail-stat"><span>DPS promedio</span><strong>${exact(p?.dps)}</strong></div><div class="detail-stat death-count"><span>${icon('skull')}Muertes</span><strong class="red">${exact(deaths?.count)}</strong></div>${deaths ? `<p class="death-times">${deaths.events.length ? deaths.events.map((d) => clock(d.elapsedMs)).join(' · ') : 'Sin muertes registradas'}</p>` : '<p class="muted small">Datos de muertes no disponibles.</p>'}`
}

function abilityTable(result, resource) {
  if (!result) return emptyResource(resource, 'Datos de habilidades no disponibles.')
  if (!result.abilities.length)
    return '<p class="skills-empty">Sin habilidades ni impactos registrados en este periodo.</p>'
  return `<div class="table-scroll"><table class="ability-table" aria-label="Daño por habilidad"><thead><tr><th><span class="sr-label">Icono</span></th><th>Habilidad</th><th>Veces usada</th><th>Daño total</th><th>Daño medio / golpe</th></tr></thead><tbody>${result.abilities.map((s) => `<tr><td>${png(s.iconPng, s.name, s.name.slice(0, 1).toUpperCase(), 'skill-portrait')}</td><td>${esc(s.name)}</td><td>${exact(s.uses)}</td><td class="gold">${exact(s.damageTotal)}</td><td>${exact(s.averageDamagePerHit)}<small class="muted hit-count">${exact(s.hits)} golpes</small></td></tr>`).join('')}</tbody></table></div>`
}

function evolution(ui, history, deaths) {
  if (!history) return emptyResource(key('history', ui.player), 'Historial de DPS no disponible.')
  if (!history.points.length) return '<p class="skills-empty">Aún no hay muestras de DPS.</p>'
  return `<div class="evolution" role="group" aria-label="Evolución de ${esc(ui.player)}"><div class="evolution-plot"><svg class="dps-line" role="img" aria-label="DPS promedio recibido del back-end"></svg><div class="y-labels" aria-hidden="true"></div><div class="graph-targets"></div></div><div class="evolution-axis"></div></div><div class="chart-legend"><span><i class="legend-gold"></i>DPS promedio</span><span class="red">${icon('skull')}Muerte${deaths ? '' : ' · sin datos'}</span><span class="muted">Tiempo de sesión</span></div>`
}

function breakdown(ui) {
  if (!ui.player) return ''
  const history = valueFor('history', ui.player)
  const deaths = valueFor('deaths', ui.player)
  const skills = valueFor('abilities', ui.player)
  const interval = ui.interval && valueFor('abilities', ui.player, ui.interval)
  return `<div class="session-strip"><h3>Evolución · ${esc(ui.player)}</h3><span>DPS promedio</span></div>${evolution(ui, history, deaths)}${ui.interval ? `<section class="interval-detail"><div class="heading"><div><span class="eyebrow">Intervalo seleccionado</span><h3>${clock(ui.interval.fromMs)} – ${clock(ui.interval.toMs)}</h3></div><button class="tool" data-action="clear-interval">${icon('close')}Quitar selección</button></div><div class="interval-totals"><span>Daño del tramo <b>${exact(interval?.damageTotal)}</b></span><span>DPS acumulado al final <b>${exact(interval?.averageDpsAtEnd)}</b></span></div>${abilityTable(interval, key('abilities', ui.player, ui.interval))}</section>` : '<p class="interval-hint">Selecciona un tramo de la gráfica para consultar sus habilidades.</p>'}<section class="global-skills"><div class="heading"><div><span class="eyebrow">Detalle del jugador / ${esc(ui.player)}</span><h3>Daño por habilidad <span class="muted small">· Sesión completa</span></h3></div><span class="pill">${exact(skills?.damageTotal)} de daño</span></div>${abilityTable(skills, key('abilities', ui.player))}<p class="skills-note">Veces usada cuenta lanzamientos; la media por golpe se refiere a los impactos registrados.</p></section>`
}

function drawGraph() {
  const ui = data.getView()
  const plot = root.querySelector('.evolution-plot')
  if (!plot || !ui.player || !ui.advanced) return
  const history = valueFor('history', ui.player)
  if (!history?.points.length) return
  const deaths = valueFor('deaths', ui.player)?.events || []
  // Solo geometría de presentación: valores y tramos vienen calculados de main.
  const width = plot.clientWidth,
    height = 150
  if (!width) return
  const endMs = Math.max(
    1,
    data.read('time') || 0,
    ...history.points.map((p) => p.elapsedMs),
    ...deaths.map((d) => d.elapsedMs)
  )
  const ceiling = Math.max(1, ...history.points.map((p) => p.averageDps)) * 1.1
  const svg = plot.querySelector('svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const points = history.points.filter((p) => finite(p.elapsedMs) && finite(p.averageDps))
  const line = points
    .map(
      (p, i) =>
        `${i ? 'L' : 'M'}${(p.elapsedMs / endMs) * width} ${height - (p.averageDps / ceiling) * height}`
    )
    .join(' ')
  svg.innerHTML = `<title>Evolución de ${esc(ui.player)}</title>${[0, 0.5, 1].map((f) => `<line x1="0" x2="${width}" y1="${height * f}" y2="${height * f}" class="evolution-grid"/>`).join('')}${line ? `<path d="${line}" class="evolution-path"/>` : ''}`
  plot.querySelector('.y-labels').innerHTML = [ceiling, ceiling / 2, 0]
    .map((n, i) => `<span style="top:${28 + (i * height) / 2}px">${fmt(n)}</span>`)
    .join('')
  const targets =
    history.intervals
      .map((range, i) => {
        const selected = ui.interval?.fromMs === range.fromMs && ui.interval?.toMs === range.toMs
        return `<button class="time-slice ${selected ? 'chosen' : ''}" data-interval="${i}" style="left:${(range.fromMs / endMs) * 100}%;width:${((range.toMs - range.fromMs) / endMs) * 100}%" aria-pressed="${selected}" aria-label="Ver habilidades de ${clock(range.fromMs)} a ${clock(range.toMs)}"></button>`
      })
      .join('') +
    deaths
      .map(
        (d, i) =>
          `<span class="death-mark" style="left:${(d.elapsedMs / endMs) * 100}%"><button data-death="${i}" aria-label="Muerte en ${clock(d.elapsedMs)}. Ver intervalo.">${icon('skull')}</button></span>`
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

function render() {
  const ui = data.getView()
  node('no-map-screen').hidden = ui.mapReady
  node('meter-app').hidden = !ui.mapReady
  if (!ui.mapReady) return
  const main = root.querySelector('main')
  const scroll = main.scrollTop
  const focused = document.activeElement
  const focusKey = ['data-player', 'data-interval', 'data-death', 'data-action'].find(
    (k) => main.contains(focused) && focused.hasAttribute(k)
  )
  const focusValue = focusKey && focused.getAttribute(focusKey)
  node('combat-view').hidden = ui.section !== 'Combate'
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
  if (ui.section === 'Combate') {
    node('el-timer').textContent = clock(data.read('time'))
    node('el-fame').textContent = fmt(data.read('fame'))
    node('el-credit').textContent = fmt(data.read('creditFame'))
    node('total-damage').textContent = fmt(data.read('totals')?.damage)
    node('total-healing').textContent = fmt(data.read('totals')?.healing)
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
  main.scrollTop = scroll
}

async function copyData() {
  const text =
    'Jugador | Daño | DPS | Aporte\n' +
    roster()
      .map((name) => {
        const stats = valueFor('damage', name)
        return `${name} | ${exact(stats?.damage)} | ${exact(stats?.dps)} | ${percent(stats?.damageSharePercent)}`
      })
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
  if (!button || !root.contains(button) || button.disabled || !data.getView().mapReady) return
  if (button.dataset.section) {
    data.setSection(button.dataset.section)
    return
  }
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
  if (button.hasAttribute('data-interval')) {
    const interval = valueFor('history', data.getView().player)?.intervals[
      Number(button.dataset.interval)
    ]
    if (interval) data.selectInterval(interval)
    return
  }
  if (button.hasAttribute('data-death')) {
    const player = data.getView().player
    const death = valueFor('deaths', player)?.events[Number(button.dataset.death)]
    const interval = valueFor('history', player)?.intervals.find(
      (r) => death && r.fromMs <= death.elapsedMs && death.elapsedMs < r.toMs
    )
    if (interval) data.selectInterval(interval)
    else
      feedback(
        death
          ? `Muerte en ${clock(death.elapsedMs)}. Su intervalo aún no está disponible.`
          : 'Datos de muerte no disponibles.'
      )
    return
  }
  try {
    switch (button.dataset.action) {
      case 'advanced':
        data.setAdvanced(!data.getView().advanced)
        chooseDefaultPlayer()
        break
      case 'clear-interval':
        data.selectInterval(null)
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
  pollTimer = setInterval(() => data.pollLegacy(), 1000)
}
window.addEventListener('beforeunload', () => {
  clearInterval(pollTimer)
  clearTimeout(noticeTimer)
  graphObserver?.disconnect()
  data.dispose()
})
