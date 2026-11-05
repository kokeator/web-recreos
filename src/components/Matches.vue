<script setup>
import { computed } from 'vue'
import { teamName, teamsOf, sportById, edit, removeMatch, groupLabel } from '../store'
import { fmtDate } from '../lib/league'

const p = defineProps({ matches: Array, editable: Boolean, showSport: Boolean, byJornada: Boolean })

const groups = computed(() => {
  const g = new Map()
  for (const m of p.matches) {
    const k = p.byJornada ? m.jornada : m.date
    if (!g.has(k)) g.set(k, { k, title: p.byJornada ? `Jornada ${m.jornada}` : fmtDate(m.date), sub: p.byJornada ? fmtDate(m.date) : '', items: [] })
    g.get(k).items.push(m)
  }
  return [...g.values()]
})
const gl = m => groupLabel(m) ? groupLabel(m) + ' · ' : ''
const label = m => { const s = sportById(m.sportId); return s ? `${s.icon} ${s.name} · ` : '' }
</script>

<template>
  <p v-if="!matches.length" class="empty">No hay partidos todavía.</p>
  <div v-for="g in groups" :key="g.k" class="box gap">
    <div class="jt"><span>{{ g.title }}</span><span>{{ g.sub }}</span></div>
    <div v-for="m in g.items" :key="m.id" class="match">
      <select v-if="editable" class="h" :value="m.homeId" aria-label="Local" @change="edit(m, 'homeId', $event.target.value)">
        <option v-for="t in teamsOf(m.sportId)" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <div v-else class="h">{{ teamName(m.homeId) }}</div>
      <div v-if="editable" class="score-edit">
        <input type="number" min="0" :value="m.hs" aria-label="Goles local" @change="edit(m, 'hs', $event.target.value)">
        <span>–</span>
        <input type="number" min="0" :value="m.as" aria-label="Goles visitante" @change="edit(m, 'as', $event.target.value)">
      </div>
      <div v-else class="score" :class="{ vs: m.hs == null || m.as == null }">{{ m.hs == null || m.as == null ? 'vs' : m.hs + ' – ' + m.as }}</div>
      <select v-if="editable" class="a" :value="m.awayId" aria-label="Visitante" @change="edit(m, 'awayId', $event.target.value)">
        <option v-for="t in teamsOf(m.sportId)" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <div v-else class="a">{{ teamName(m.awayId) }}</div>
      <div v-if="editable" class="meta edit">
        <input type="number" min="1" class="jn" :value="m.jornada" aria-label="Jornada" title="Jornada" @change="edit(m, 'jornada', $event.target.value)">
        <input type="date" :value="m.date" @change="edit(m, 'date', $event.target.value)">
        <input type="time" :value="m.time" @change="edit(m, 'time', $event.target.value)">
        <input type="text" :value="m.court" placeholder="Pista" @change="edit(m, 'court', $event.target.value)">
        <button type="button" class="x" @click="removeMatch(m.id)">Borrar</button>
      </div>
      <div v-else class="meta">{{ showSport ? label(m) : '' }}{{ gl(m) }}{{ m.time }} · 📍 {{ m.court }}</div>
    </div>
  </div>
</template>
