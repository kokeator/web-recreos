import { reactive } from 'vue'
import { roundRobin, addDays } from './lib/league'

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
export const teamName = id => (state.data.teams.find(t => t.id === id) || {}).name || '—'

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
  m[key] = (key === 'hs' || key === 'as') ? (val === '' ? null : Number(val)) : val; commit()
}
// Genera el calendario todos-contra-todos de un deporte (borra el anterior).
export function generate(sportId) {
  const d = state.data, sp = sportById(sportId)
  const ids = teamsOf(sportId).map(t => t.id)
  d.matches = d.matches.filter(m => m.sportId !== sportId)
  roundRobin(ids).forEach((ms, j) => ms.forEach(([homeId, awayId], k) => d.matches.push({
    id: uid(), sportId, jornada: j + 1, homeId, awayId,
    date: addDays(d.start, sp.day - 1 + 7 * j), time: sp.time,
    court: sp.courts[k % sp.courts.length] || '', hs: null, as: null,
  })))
  commit()
}
