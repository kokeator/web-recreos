<script setup>
import { computed } from 'vue'
import { state, teamName, teamsOf, sportById, edit, removeMatch, groupLabel, homeOf, awayOf } from '../store'
import { fmtDate, effDate } from '../lib/league'

const p = defineProps({ matches: Array, editable: Boolean, showSport: Boolean, byJornada: Boolean })

const groups = computed(() => {
  const g = new Map()
  for (const m of p.matches) {
    const d = effDate(m)
    const k = p.byJornada ? m.jornada : (d || 'tbd')
    if (!g.has(k)) g.set(k, { k, title: p.byJornada ? title(m) : (d ? fmtDate(d) : 'Fecha por confirmar'), items: [] })
    g.get(k).items.push(m)
  }
  return [...g.values()].map(x => ({ ...x, sub: p.byJornada ? fmtDate((x.items.find(i => !i.postponed) || x.items[0]).date) : '' }))
})
const title = m => m.round ? m.round + (m.leg === 1 ? ' · Ida' : m.leg === 2 ? ' · Vuelta' : '') : `Jornada ${m.jornada}`
const gl = m => groupLabel(m) ? groupLabel(m) + ' · ' : ''
const label = m => { const s = sportById(m.sportId); return s ? `${s.icon} ${s.name} · ` : '' }
const isBasket = m => m.sportId === 'basket'
const players = m => [homeOf(m), awayOf(m)].flatMap(id => (state.data.teams.find(t => t.id === id) || {}).players || [])
const postText = m => m.postponedTo ? `Nueva fecha: ${fmtDate(m.postponedTo)} · ` : 'Fecha por confirmar · '
// Eliminatoria a partido único empatada, o a doble partido con global empatado (se ve en la vuelta)
const head = m => m.legOf ? state.data.matches.find(x => x.id === m.legOf) : m
const tie = m => {
  if (m.stage !== 'ko') return false
  if (m.legOf) { const h = head(m); return Boolean(h) && [h.hs, h.as, m.hs, m.as].every(x => x != null) && h.hs + m.as === h.as + m.hs }
  return !m.leg && m.hs != null && m.hs === m.as
}
const agg = m => {
  const h = m.legOf && head(m)
  if (!h || [h.hs, h.as, m.hs, m.as].some(x => x == null)) return ''
  return `Global: ${teamName(homeOf(h))} ${h.hs + m.as} – ${h.as + m.hs} ${teamName(awayOf(h))}`
}
const roundTag = m => m.round && p.showSport ? title(m) + ' · ' : ''
</script>

<template>
  <p v-if="!matches.length" class="empty">No hay partidos todavía.</p>
  <div v-for="g in groups" :key="g.k" class="box gap">
    <div class="jt"><span>{{ g.title }}</span><span>{{ g.sub }}</span></div>
    <div v-for="m in g.items" :key="m.id" class="match" :class="{ postponed: m.postponed }">
      <select v-if="editable && !m.srcHome && !m.legOf" class="h" :value="m.homeId" aria-label="Local" @change="edit(m, 'homeId', $event.target.value)">
        <option value="">Por definir</option>
        <option v-for="t in teamsOf(m.sportId)" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <div v-else class="h">{{ teamName(homeOf(m)) }}</div>
      <div v-if="editable" class="score-edit">
        <input type="number" min="0" :value="m.hs" aria-label="Goles local" @change="edit(m, 'hs', $event.target.value)">
        <span>–</span>
        <input type="number" min="0" :value="m.as" aria-label="Goles visitante" @change="edit(m, 'as', $event.target.value)">
      </div>
      <div v-else class="score" :class="{ vs: m.hs == null || m.as == null }">{{ m.hs == null || m.as == null ? 'vs' : m.hs + ' – ' + m.as }}</div>
      <select v-if="editable && !m.srcAway && !m.legOf" class="a" :value="m.awayId" aria-label="Visitante" @change="edit(m, 'awayId', $event.target.value)">
        <option value="">Por definir</option>
        <option v-for="t in teamsOf(m.sportId)" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <div v-else class="a">{{ teamName(awayOf(m)) }}</div>

      <div v-if="editable" class="meta edit">
        <input type="number" min="1" class="jn" :value="m.jornada" aria-label="Jornada" title="Jornada" @change="edit(m, 'jornada', $event.target.value)">
        <input type="date" :value="m.date" @change="edit(m, 'date', $event.target.value)">
        <input type="time" :value="m.time" @change="edit(m, 'time', $event.target.value)">
        <input type="text" :value="m.court" placeholder="Pista" @change="edit(m, 'court', $event.target.value)">
        <label class="chk-inline"><input type="checkbox" :checked="m.postponed" @change="edit(m, 'postponed', $event.target.checked)"> Aplazado</label>
        <input v-if="m.postponed" type="date" :value="m.postponedTo" title="Nueva fecha" aria-label="Nueva fecha" @change="edit(m, 'postponedTo', $event.target.value)">
        <select v-if="tie(m)" :value="head(m).winnerId" aria-label="Quién pasa" @change="edit(head(m), 'winnerId', $event.target.value)">
          <option value="">¿Quién pasa? (empate)</option>
          <option :value="homeOf(head(m))">{{ teamName(homeOf(head(m))) }}</option>
          <option :value="awayOf(head(m))">{{ teamName(awayOf(head(m))) }}</option>
        </select>
        <template v-if="isBasket(m)">
          <input type="text" :value="m.mvp" :list="'mvp-' + m.id" placeholder="MVP del partido" @change="edit(m, 'mvp', $event.target.value)">
          <datalist :id="'mvp-' + m.id"><option v-for="n in players(m)" :key="n" :value="n" /></datalist>
        </template>
        <button type="button" class="x" @click="removeMatch(m.id)">Borrar</button>
      </div>
      <div v-else class="meta">
        <span v-if="m.postponed" class="badge">Aplazado</span>
        {{ roundTag(m) }}{{ showSport ? label(m) : '' }}{{ gl(m) }}{{ m.postponed ? postText(m) : '' }}{{ m.time }} · 📍 {{ m.court }}
      </div>
      <div v-if="agg(m)" class="mvp">{{ agg(m) }}</div>
      <div v-if="tie(m) && head(m).winnerId && !editable" class="mvp">Pasa: {{ teamName(head(m).winnerId) }}</div>
      <div v-if="m.mvp && !editable" class="mvp">⭐ MVP: {{ m.mvp }}</div>
    </div>
  </div>
</template>
