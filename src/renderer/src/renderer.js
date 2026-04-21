/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* ══════════════════════════════════════════════════════════
   ESTADO
══════════════════════════════════════════════════════════ */
let mapLoaded = false
let resetOnMapChange = false;
let t0 = Date.now()
let paused = false
let pausedAt = 0
let pausedTotal = 0
let totalFame = 0

let players = []

/* ══════════════════════════════════════════════════════════
   API PÚBLICA
══════════════════════════════════════════════════════════ */

window.mainApi.onMapLoad((data)=>{
  if(!mapLoaded)
    _activateMap();
  else{
    if(resetOnMapChange)
      _activateMap();
  }
});

window.mainApi.onPlayerAdded((data)=>{
  if(!exists(data)){
    setDamage(data, 0, false);
  }else{
  }
});

window.mainApi.onPlayerRemoved((data)=>{
  removePlayer(data["name"]);
});

window.mainApi.onLocalPlayerLeave((data)=>{
  players.splice(1, players.length-1);
});


/* ══════════════════════════════════════════════════════════
   ACTIVAR MAPA
══════════════════════════════════════════════════════════ */
function removePlayer(name){
  if(exists(name)){
    for(let i = 0; i < players.length; i++){
      if(players[i].name == name){
        players.splice(i, 1);
      }
    }
  }
}

function _activateMap(zoneName) {
  mapLoaded = true
  t0 = Date.now()
  pausedTotal = 0
  document.getElementById('el-dot').classList.remove('off')
  document.getElementById('el-status').textContent = 'Activo'
  document.getElementById('no-map-screen').style.display = 'none'
  render()
}

/* ══════════════════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════════════════ */

function playerByName(name){
  for(let i = 0; i < players.length; i++){
    if(players[i].name == name){
      return i;
    }
  }
  return -1;
}

function setDamage(name, dmg, idFound) {
    //if (!mapLoaded || paused) return;
    let pFound = playerByName(name);
    if(pFound == -1) {
      players.push({ name, dmg: 0, isHealer: false, dps: 0, idFound: false });
      pFound = players.length-1;
    }
    players[pFound].dmg = dmg;
    players[pFound].idFound = idFound;
    players[pFound].isHealer = players[pFound].dmg < 0;
    //render();
  };
function setFame(amount) {
  if (mapLoaded && !paused) totalFame = amount;
};

function exists(name){
  for(let i = 0; i < players.length; i++){
    if(players[i].name == name){
      return true;
    }
  }
  return false;
}

function elapsed() {
  return paused ? pausedAt - t0 - pausedTotal : Date.now() - t0 - pausedTotal
}

function fmt(n) {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (a >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Math.round(n).toLocaleString('es')
}

function fmtTime(ms) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sc = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
}

function esc(s) {
  if(!s) return "";
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

window.togglePause = togglePause;

/* ══════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════ */
async function render() {
  if (!mapLoaded) return

  setFame(await window.mainApi.getFame());

  const ms = elapsed()
  const sec = Math.max(ms / 1000, 1)
  const fph = (totalFame / sec) * 3600

  for(let i = 0; i < players.length; i++){
    let p = players[i];
    let dmg = await window.mainApi.getDamageAndDPS(p.name);
    if(!dmg){
      removePlayer(p.name);
      continue;
    }
    setDamage(p.name, dmg.damage, dmg.idFound);
  }

  document.getElementById('el-timer').textContent = fmtTime(ms)
  document.getElementById('el-fame').textContent = fmt(totalFame)
  document.getElementById('el-fph').textContent = fmt(fph)

  const list = Object.values(players)
  if (!list.length) {
    document.getElementById('el-rows').innerHTML = ''
    document.getElementById('el-count').textContent = '0 jugadores'
    return
  }

  list.sort((a, b) => {
    if (a.isHealer !== b.isHealer) return a.isHealer ? 1 : -1
    return a.isHealer ? a.dmg - b.dmg : b.dmg - a.dmg
  })

  const dpsOnly = list.filter((p) => !p.isHealer)
  const healOnly = list.filter((p) => p.isHealer)
  const maxDmg = Math.max(...dpsOnly.map((p) => p.dmg), 1)
  const maxHeal = Math.max(...healOnly.map((p) => Math.abs(p.dmg)), 1)
  
  // Total damage / healing from the group for the percentage calculation
  const totalGroupDmg = dpsOnly.reduce((sum, p) => sum + p.dmg, 0) || 1;
  const totalGroupHeal = healOnly.reduce((sum, p) => sum + Math.abs(p.dmg), 0) || 1;

  let rankDps = 0

  for(let i = 0; i < list.length; i++){
    let p = list[i];
    let damages = await window.mainApi.getDamageAndDPS(p.name);
    if(damages)
      p.dps = damages.dps;
    else
      removePlayer(p.name);
  }

  const html = list
    .map((p) => {
      const dps = p.dps
      const pct = p.isHealer
        ? ((Math.abs(p.dmg) / maxHeal) * 100).toFixed(1)
        : ((p.dmg / maxDmg) * 100).toFixed(1)
        
      // Group contribution percentage
      const groupPct = p.isHealer
        ? ((Math.abs(p.dmg) / totalGroupHeal) * 100).toFixed(1)
        : ((p.dmg / totalGroupDmg) * 100).toFixed(1)

      let rankLabel = '✚',
        rankCls = ''
      if (!p.isHealer) {
        rankDps++
        //rankLabel = rankDps
        rankCls = rankDps <= 3 ? `r${rankDps}` : ''
      }

      return `
    <div class="p-row ${p.isHealer ? 'healer' : ''} ${!p.idFound ? 'not-id':''}">
      <div class="bar" style="width:${pct}%"></div>
      <div class="p-inner">
        <span class="rank ${rankCls}">${rankLabel}</span>
        <span class="pname">${esc(p.name)}${p.isHealer ? '<span class="heal-tag">HEAL</span>' : ''}</span>
        <span class="pdmg">${fmt(p.dmg)}</span>
        <span class="ppct">${groupPct}%</span>
        <span class="pdps">${fmt(dps)}/s</span>
      </div>
    </div>`
  })
    .join('')

  document.getElementById('el-rows').innerHTML = html

  const parts = []
  if (dpsOnly.length) parts.push(`${dpsOnly.length} DPS`)
  if (healOnly.length) parts.push(`${healOnly.length} Healer${healOnly.length > 1 ? 's' : ''}`)
  document.getElementById('el-count').textContent = parts.join(' · ')
}

document.getElementById("reset-button").addEventListener("click", ()=>{
  resetAll();
});

document.getElementById("btn-pause").addEventListener("click", ()=>{
  togglePause();
});

document.getElementById("btn-copiar").addEventListener("click", ()=>{
  copyDpsData();
});

/* ══════════════════════════════════════════════════════════
   CONTROLES
══════════════════════════════════════════════════════════ */
async function resetAll() {


  players = [];
  let gottenPlayers = await window.mainApi.getPlayers();
  for(let i = 0; i < gottenPlayers.length; i++){
    setDamage(gottenPlayers[i].name, 0);
  }

  t0 = Date.now();
  pausedTotal = 0;
  if (paused) _unpause()
  
  window.mainApi.sendReset();


  render()
}

function togglePause() {
  paused ? _unpause() : _pause()
}
function _pause() {
  paused = true
  pausedAt = Date.now()
  document.getElementById('btn-pause').classList.add('on')
  document.getElementById('btn-pause').innerHTML = '▶ Reanudar'
  document.getElementById('el-dot').classList.add('off')
  document.getElementById('el-status').textContent = 'Pausado'
  window.mainApi.sendPause();
}
function _unpause() {
  pausedTotal += Date.now() - pausedAt
  paused = false
  document.getElementById('btn-pause').classList.remove('on')
  document.getElementById('btn-pause').innerHTML = '⏸ Pausar'
  document.getElementById('el-dot').classList.remove('off')
  document.getElementById('el-status').textContent = 'Activo'
  window.mainApi.sendUnpause();
}

function copyDpsData() {
  const list = Object.values(players);
  if (!list.length) return;

  // Ordenar la lista igual que en el render principal
  list.sort((a, b) => {
    if (a.isHealer !== b.isHealer) return a.isHealer ? 1 : -1;
    return a.isHealer ? a.dmg - b.dmg : b.dmg - a.dmg;
  });

  const dpsOnly = list.filter((p) => !p.isHealer);
  const healOnly = list.filter((p) => p.isHealer);
  
  const totalGroupDmg = dpsOnly.reduce((sum, p) => sum + p.dmg, 0) || 1;
  const totalGroupHeal = healOnly.reduce((sum, p) => sum + Math.abs(p.dmg), 0) || 1;

  // Cabecera del texto
  let textToCopy = "Player|Daño|DPS|porcentaje\n";

  // Rellenar la información
  for (let i = 0; i < list.length; i++) {
    let p = list[i];
    const groupPct = p.isHealer
      ? ((Math.abs(p.dmg) / totalGroupHeal) * 100).toFixed(1)
      : ((p.dmg / totalGroupDmg) * 100).toFixed(1);

    textToCopy += `${p.name}|${fmt(p.dmg)}|${fmt(p.dps)}|${groupPct}%\n`;
  }

  // Crear un elemento temporal para copiar al portapapeles de manera segura
  const textArea = document.createElement("textarea");
  textArea.value = textToCopy;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    
    // Feedback visual opcional en el botón
    const btn = document.getElementById("btn-copiar");
    const originalText = btn.innerHTML;
    btn.innerHTML = '✔ Copiado';
    setTimeout(() => btn.innerHTML = originalText, 1500);
  } catch (err) {
    console.error('Error al copiar: ', err);
  }
  
  document.body.removeChild(textArea);
}

/* ══════════════════════════════════════════════════════════
   LOOP PRINCIPAL
══════════════════════════════════════════════════════════ */
setInterval(() => {
  if (mapLoaded && !paused) render()
  //let players = await window.mainApi.getPlayers();
}, 1000)