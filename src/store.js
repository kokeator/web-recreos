import { reactive } from 'vue'
import { roundRobin, addDays, effDate, qualifiers, seedOrder, shuffle } from './lib/league'

const uid = () => Math.random().toString(36).slice(2, 9)
const S = (id, name, icon, color, day, time, courts) => ({ id, name, icon, color, day, time, courts })

// Deportes por defecto. day: 1 = lunes ... 5 = viernes. Todo se puede cambiar desde el modo admin.
export const defaults = () => ({
  start: '2026-11-02',
  sports: [
    S('futbol', 'Fútbol', '⚽', '#1f8a4c', 1, '11:00', ['Pista de fútbol 1', 'Pista de fútbol 2']),
    S('basket', 'Basket', '🏀', '#e8590c', 2, '11:00', ['Pista de baloncesto']),
    S('voley', 'Voleibol', '🏐', '#c99700', 3, '11:00', ['Pista de voleibol']),
    S('padel-alto', 'Pádel · Nivel alto', '🎾', '#1c64d6', 4, '11:00', ['Pista de pádel 1', 'Pista de pádel 2']),
    S('padel-medio', 'Pádel · Nivel medio', '🎾', '#6f42c1', 4, '11:30', ['Pista de pádel 1', 'Pista de pádel 2']),
    S('futtenis', 'Fut-tenis', '🥅', '#d6336c', 5, '11:00', ['Pista de fut-tenis']),
  ],
  teams: [],   // { id, sportId, name, players: [] }
  matches: [], // { id, sportId, jornada, homeId, awayId, date, time, court, hs, as }
})

export const state = reactive({ data: defaults(), mode: 'loading', admin: false, status: '' })

const KEY = 'liga-recreos'
let pw = sessionStorage.getItem('liga-pw') || ''
let timer

// ---------- Carga y guardado ----------
export async function load() {
  try {
    const r = await fetch('/api/data')
    const json = (r.headers.get('content-type') || '').includes('json')
    if (r.status === 404 || !json) throw new Error('sin-api') // desarrollo local sin backend
    if (!r.ok) { state.mode = 'error'; return }
    const d = await r.json()
    if (d && d.sports) state.data = d
    state.mode = 'online'
    if (pw) state.admin = await check(pw)
  } catch {
    state.mode = 'demo'; state.admin = true
    try { const l = JSON.parse(localStorage.getItem(KEY)); if (l && l.sports) state.data = l } catch {}
  }
}
async function check(p) {
  try { return (await fetch('/api/data?auth=1', { headers: { 'x-admin-password': p } })).ok } catch { return false }
}
export async function login(p) {
  if (!(await check(p))) return false
  pw = p; sessionStorage.setItem('liga-pw', p); state.admin = true; return true
}
export function logout() { pw = ''; sessionStorage.removeItem('liga-pw'); state.admin = false }

export function commit() {
  clearTimeout(timer); state.status = 'Guardando…'
  timer = setTimeout(async () => {
    try {
      if (state.mode === 'demo') localStorage.setItem(KEY, JSON.stringify(state.data))
      else {
        const r = await fetch('/api/data', {
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-admin-password': pw },
          body: JSON.stringify(state.data),
        })
        if (!r.ok) throw new Error(r.status)
      }
      state.status = 'Guardado ✓'
    } catch { state.status = 'Error al guardar' }
  }, 500)
}

// ---------- Consultas ----------
export const sportById = id => state.data.sports.find(s => s.id === id)
export const teamsOf = sportId => state.data.teams.filter(t => t.sportId === sportId)
export const teamName = id => id ? ((state.data.teams.find(t => t.id === id) || {}).name || '—') : 'Por definir'

// ---------- Acciones (solo admin) ----------
export function addTeam(sportId, name) {
  name = (name || '').trim(); if (!name) return
  state.data.teams.push({ id: uid(), sportId, name, players: [] }); commit()
}
export function removeTeam(id) {
  const d = state.data
  d.teams = d.teams.filter(t => t.id !== id)
  d.matches = d.matches.filter(m => m.homeId !== id && m.awayId !== id); commit()
}
export function addPlayer(team, name) {
  name = (name || '').trim(); if (!name) return
  team.players.push(name); commit()
}
export function removePlayer(team, i) { team.players.splice(i, 1); commit() }
export function setSport(sport, key, val) { sport[key] = val; commit() }
export function edit(m, key, val) {
  if (key === 'hs' || key === 'as') m[key] = val === '' ? null : Number(val)
  else if (key === 'jornada') m[key] = Math.max(1, Number(val) || 1)
  else m[key] = val
  if (key === 'postponed' && !val) m.postponedTo = ''
  commit()
}
// Calendario manual: añadir o quitar un partido suelto.
export function addMatch(sportId, f) {
  state.data.matches.push({
    id: uid(), sportId, jornada: f.jornada, homeId: f.homeId, awayId: f.awayId,
    date: f.date, time: f.time, court: f.court, hs: null, as: null,
  }); commit()
}
export function removeMatch(id) { state.data.matches = state.data.matches.filter(m => m.id !== id); commit() }
// Genera el calendario todos-contra-todos de un deporte (borra el anterior).
// Si los equipos tienen grupo, se juega dentro de cada grupo (fase de grupos).
export function generate(sportId) {
  const d = state.data, sp = sportById(sportId)
  d.matches = d.matches.filter(m => m.sportId !== sportId)
  const byGroup = {}
  teamsOf(sportId).forEach(t => (byGroup[t.group || ''] ||= []).push(t.id))
  const rounds = []
  Object.keys(byGroup).sort().forEach(g => {
    let rr = roundRobin(byGroup[g])
    if (sp.vuelta) rr = [...rr, ...rr.map(ms => ms.map(([h, a]) => [a, h]))] // ida y vuelta
    rr.forEach((ms, j) => (rounds[j] ||= []).push(...ms))
  })
  rounds.forEach((ms, j) => ms.forEach(([homeId, awayId], k) => d.matches.push({
    id: uid(), sportId, jornada: j + 1, homeId, awayId,
    date: addDays(d.start, sp.day - 1 + 7 * j), time: sp.time,
    court: sp.courts[k % sp.courts.length] || '', hs: null, as: null,
  })))
  commit()
}

// ---------- Grupos ----------
export const GROUPS = 'ABCDEFGH'.split('')
export function setGroup(team, g) { team.group = g; commit() }
export function splitGroups(sportId, n, random) {
  const ts = teamsOf(sportId).slice()
  if (random) for (let i = ts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ts[i], ts[j]] = [ts[j], ts[i]] }
  ts.forEach((t, i) => { t.group = GROUPS[i % n] })
  commit()
}
export function clearGroups(sportId) { teamsOf(sportId).forEach(t => { t.group = '' }); commit() }
// "Grupo A" si los dos equipos del partido son del mismo grupo, si no ''.
export function groupLabel(m) {
  const a = state.data.teams.find(t => t.id === m.homeId), b = state.data.teams.find(t => t.id === m.awayId)
  return m.stage !== 'ko' && a && b && a.group && a.group === b.group ? `Grupo ${a.group}` : ''
}

// ---------- Eliminatorias ----------
const byId = id => state.data.matches.find(m => m.id === id)
// Ganador de un partido o eliminatoria ('' si aún no se sabe).
// Si el partido tiene vuelta (otro partido con legOf = su id), gana el global de los dos partidos.
// En empate (penaltis/prórroga) se usa winnerId, que se elige a mano.
export function winnerId(m) {
  if (!m) return ''
  const v = state.data.matches.find(x => x.legOf === m.id)
  if (v) {
    if ([m.hs, m.as, v.hs, v.as].some(x => x == null)) return ''
    const h = homeOf(m), a = awayOf(m), gh = m.hs + v.as, ga = m.as + v.hs
    return gh > ga ? h : gh < ga ? a : (m.winnerId || '')
  }
  if (m.hs == null || m.as == null) return ''
  if (m.hs > m.as) return homeOf(m)
  if (m.hs < m.as) return awayOf(m)
  return m.winnerId || ''
}
// En la vuelta, local y visitante son los de la ida al revés.
export const homeOf = m => m.legOf ? awayOf(byId(m.legOf)) : (m.homeId || (m.srcHome ? winnerId(byId(m.srcHome)) : ''))
export const awayOf = m => m.legOf ? homeOf(byId(m.legOf)) : (m.awayId || (m.srcAway ? winnerId(byId(m.srcAway)) : ''))

// Clasificados por defecto según el formato de cada deporte (se pueden cambiar en la web).
export const defaultQuota = (sportId, g) => (sportId === 'futbol' && { A: 3, B: 3, C: 2 }[g]) || 2
export const defaultTotal = sportId => sportId.startsWith('padel') ? 8 : 4
const ROUND = { 2: 'Final', 4: 'Semifinales', 8: 'Cuartos de final', 16: 'Octavos de final' }

// mode: 'seed' (por clasificación) | 'random' (al azar) | 'manual' (huecos vacíos). Devuelve un error o ''.
export function generateKO(sportId, mode) {
  const d = state.data, sp = sportById(sportId)
  const liga = d.matches.filter(m => m.sportId === sportId && m.stage !== 'ko')
  const teams = teamsOf(sportId)
  const names = [...new Set(teams.map(t => t.group || ''))].sort()
  const grouped = names.some(g => g !== '')
  const quota = g => (sp.qual && sp.qual[g] != null) ? sp.qual[g] : defaultQuota(sportId, g)
  const total = sp.qualTotal != null ? sp.qualTotal : defaultTotal(sportId)
  const n = grouped ? names.reduce((s, g) => s + quota(g), 0) : total
  if (!ROUND[n]) return `Hay ${n} clasificados: tienen que ser 2, 4, 8 o 16.`
  const ids = qualifiers(teams, liga, quota, total)
  if (mode !== 'manual' && ids.length !== n) return `Faltan equipos: se necesitan ${n} y solo hay ${ids.length}.`

  const slots = n / 2, order = seedOrder(n)
  let pairs
  if (mode === 'manual') pairs = Array.from({ length: slots }, () => ['', ''])
  else if (mode === 'random') { const s = shuffle(ids); pairs = Array.from({ length: slots }, (_, i) => [s[2 * i], s[2 * i + 1]]) }
  else pairs = Array.from({ length: slots }, (_, i) => [ids[order[2 * i] - 1], ids[order[2 * i + 1] - 1]])

  const dates = liga.map(m => effDate(m) || m.date).filter(Boolean).sort()
  const base = dates.length ? dates[dates.length - 1] : addDays(d.start, sp.day - 1)
  const maxJ = Math.max(0, ...liga.map(m => m.jornada))
  d.matches = d.matches.filter(m => !(m.sportId === sportId && m.stage === 'ko'))
  const vuelta = Boolean(sp.koVuelta)
  let prev = [], j = 0 // j = nº de jornadas de eliminatoria ya ocupadas
  for (let count = slots; count >= 1; count /= 2) {
    const two = vuelta && !(count === 1 && sp.koFinalUnica)
    const row = []
    for (let k = 0; k < count; k++) {
      const court = sp.courts[k % sp.courts.length] || ''
      const m = {
        id: uid(), sportId, stage: 'ko', round: ROUND[count * 2], jornada: maxJ + j + 1,
        homeId: '', awayId: '', date: addDays(base, 7 * (j + 1)), time: sp.time, court, hs: null, as: null,
      }
      if (two) m.leg = 1
      if (j === 0) { m.homeId = pairs[k][0]; m.awayId = pairs[k][1] }
      else { m.srcHome = prev[2 * k].id; m.srcAway = prev[2 * k + 1].id }
      row.push(m)
      d.matches.push(m)
      if (two) d.matches.push({
        id: uid(), sportId, stage: 'ko', round: m.round, leg: 2, legOf: m.id, jornada: maxJ + j + 2,
        date: addDays(base, 7 * (j + 2)), time: sp.time, court, hs: null, as: null,
      })
    }
    prev = row; j += two ? 2 : 1
  }
  commit()
  return ''
}
export function clearKO(sportId) {
  state.data.matches = state.data.matches.filter(m => !(m.sportId === sportId && m.stage === 'ko')); commit()
}
