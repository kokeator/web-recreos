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
