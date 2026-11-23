export const addDays = (d, n) => {
  const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}
export const fmtDate = d => d
  ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  : 'Sin fecha'

// Todos contra todos (método del círculo). Devuelve una lista de jornadas con parejas [local, visitante].
export function roundRobin(ids) {
  const t = ids.slice(); if (t.length % 2) t.push(null)
  const n = t.length, rounds = []
  for (let r = 0; r < n - 1; r++) {
    const ms = []
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i]
      if (a && b) ms.push(r % 2 ? [b, a] : [a, b])
    }
    rounds.push(ms)
    t.splice(1, 0, t.pop())
  }
  return rounds
}

// Clasificación: victoria 3, empate 1, derrota 0. Desempata por diferencia y goles a favor.
export function standings(teams, matches) {
  const t = Object.fromEntries(teams.map(x => [x.id, { id: x.id, name: x.name, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]))
  for (const m of matches) {
    if (m.hs == null || m.as == null) continue
    const a = t[m.homeId], b = t[m.awayId]; if (!a || !b) continue
    a.pj++; b.pj++; a.gf += m.hs; a.gc += m.as; b.gf += m.as; b.gc += m.hs
    if (m.hs > m.as) { a.g++; b.p++; a.pts += 3 }
    else if (m.hs < m.as) { b.g++; a.p++; b.pts += 3 }
    else { a.e++; b.e++; a.pts++; b.pts++ }
  }
  return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.name.localeCompare(y.name))
}

// Fecha efectiva de un partido: la nueva si está aplazado ('' si aún no hay fecha nueva).
export const effDate = m => m.postponed ? (m.postponedTo || '') : m.date

// ---------- Eliminatorias ----------
export const shuffle = a => {
  const x = a.slice()
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] }
  return x
}
// Orden de cabezas de serie para que 1º y 2º solo se crucen en la final: 8 -> [1,8,4,5,2,7,3,6]
export function seedOrder(n) {
  let o = [1, 2]
  while (o.length < n) o = o.flatMap(x => [x, o.length * 2 + 1 - x])
  return o
}
// Clasificados (ids ordenados de mejor a peor). Con grupos: los N primeros de cada grupo
// (quotaOf(grupo)); se ordenan por posición en su grupo y luego por puntos. Sin grupos: los `total` primeros.
export function qualifiers(teams, matches, quotaOf, total) {
  const groups = [...new Set(teams.map(t => t.group || ''))].sort()
  if (groups.every(g => g === '')) return standings(teams, matches).slice(0, total).map(r => r.id)
  const picked = []
  for (const g of groups) {
    standings(teams.filter(t => (t.group || '') === g), matches).slice(0, quotaOf(g)).forEach((r, i) => picked.push({ ...r, pos: i }))
  }
  picked.sort((a, b) => a.pos - b.pos || b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
  return picked.map(r => r.id)
}
