<script setup>
import { ref, computed } from 'vue'
import { state, teamsOf, generate, generateKO, clearKO, setSport, winnerId, teamName, defaultQuota, defaultTotal } from '../store'
import { standings, qualifiers } from '../lib/league'
import Standings from './Standings.vue'
import Matches from './Matches.vue'
import Teams from './Teams.vue'
import ManualMatch from './ManualMatch.vue'

const p = defineProps({ sport: Object })
const sub = ref('clas')
const mode = ref('seed')
const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const ROUNDS = { 2: 'Final', 4: 'Semifinales y final', 8: 'Cuartos, semifinales y final', 16: 'Octavos, cuartos, semifinales y final' }
const teams = computed(() => teamsOf(p.sport.id))
const all = computed(() => state.data.matches.filter(m => m.sportId === p.sport.id))
const byJornada = (a, b) => a.jornada - b.jornada || a.time.localeCompare(b.time)
const liga = computed(() => all.value.filter(m => m.stage !== 'ko').sort(byJornada))
const ko = computed(() => all.value.filter(m => m.stage === 'ko').sort(byJornada))
const tabs = computed(() => [['clas', 'Clasificación'], ['cal', 'Calendario y resultados'], ['ko', 'Eliminatorias'], ['eq', 'Equipos y jugadores'], ...(state.admin ? [['aj', 'Ajustes']] : [])])

// Una tabla por grupo (o una sola si no hay grupos)
const groupNames = computed(() => [...new Set(teams.value.map(t => t.group || ''))].sort())
const hasGroups = computed(() => groupNames.value.some(g => g !== ''))
const tables = computed(() => groupNames.value.map(g => ({
  name: g,
  title: g ? `Grupo ${g}` : (groupNames.value.length > 1 ? 'Sin grupo' : ''),
  rows: standings(teams.value.filter(t => (t.group || '') === g), liga.value),
})))

// Eliminatorias
const quota = g => (p.sport.qual && p.sport.qual[g] != null) ? p.sport.qual[g] : defaultQuota(p.sport.id, g)
const total = computed(() => p.sport.qualTotal != null ? p.sport.qualTotal : defaultTotal(p.sport.id))
const slots = computed(() => hasGroups.value ? groupNames.value.reduce((s, g) => s + quota(g), 0) : total.value)
const qualNames = computed(() => qualifiers(teams.value, liga.value, quota, total.value).map(teamName))
const champion = computed(() => { const f = ko.value.find(m => m.round === 'Final' && m.leg !== 2); return f ? winnerId(f) : '' })
const setQuota = (g, v) => setSport(p.sport, 'qual', { ...(p.sport.qual || {}), [g]: Math.max(0, Number(v) || 0) })

function regen() {
  if (teams.value.length < 2) return window.alert('Añade al menos 2 equipos.')
  if (all.value.length && !window.confirm('Se borrará el calendario, los resultados y las eliminatorias de este deporte. ¿Continuar?')) return
  generate(p.sport.id)
}
function makeKO() {
  if (!ROUNDS[slots.value]) return window.alert(`Hay ${slots.value} clasificados: tienen que ser 2, 4, 8 o 16.`)
  if (ko.value.length && !window.confirm('Se reemplazarán las eliminatorias actuales. ¿Continuar?')) return
  const err = generateKO(p.sport.id, mode.value)
  if (err) window.alert(err)
}
const setCourts = v => setSport(p.sport, 'courts', v.split(',').map(s => s.trim()).filter(Boolean))
</script>

<template>
  <div class="band"></div>
  <div class="sub-row">
    <button v-for="[k, l] in tabs" :key="k" class="sub" :aria-current="sub === k" @click="sub = k">{{ l }}</button>
  </div>

  <section v-if="sub === 'clas'">
    <h2>Clasificación</h2>
    <p v-if="!teams.length" class="empty">Añade equipos para ver la clasificación.</p>
    <Standings v-for="t in tables" :key="t.name" :rows="t.rows" :title="t.title" />
    <p class="note">Victoria 3 puntos · empate 1 · derrota 0.</p>
  </section>

  <section v-else-if="sub === 'cal'">
    <h2>Calendario</h2>
    <template v-if="state.admin">
      <p class="note">Puedes crear el calendario tú, partido a partido, o generarlo solo con todos contra todos.</p>
      <ManualMatch :sport="sport" :teams="teams" :matches="liga" />
      <button class="btn ghost" @click="regen">{{ all.length ? 'Regenerar calendario automático' : 'Generar calendario automático' }}</button>
    </template>
    <Matches :matches="liga" :editable="state.admin" by-jornada />
  </section>

  <section v-else-if="sub === 'ko'">
    <h2>Eliminatorias</h2>
    <p v-if="champion" class="champ">🏆 Campeón: {{ teamName(champion) }}</p>
    <div v-if="state.admin" class="box form">
      <b class="boxtitle">Configurar eliminatorias</b>
      <template v-if="hasGroups">
        <label v-for="g in groupNames" :key="g">Pasan del {{ g ? 'Grupo ' + g : 'resto' }}
          <input type="number" min="0" :value="quota(g)" @change="setQuota(g, $event.target.value)">
        </label>
      </template>
      <label v-else>Equipos clasificados
        <input type="number" min="2" :value="total" @change="setSport(sport, 'qualTotal', Math.max(2, +$event.target.value || 2))">
      </label>
      <p class="note">Total: {{ slots }} equipos · {{ ROUNDS[slots] || 'tiene que ser 2, 4, 8 o 16' }}</p>
      <label>Cruces
        <select v-model="mode">
          <option value="seed">Por clasificación (el mejor contra el peor)</option>
          <option value="random">Aleatorios</option>
          <option value="manual">Los elijo yo (huecos vacíos)</option>
        </select>
      </label>
      <label class="chk-inline"><input type="checkbox" :checked="sport.koVuelta" @change="setSport(sport, 'koVuelta', $event.target.checked)"> Eliminatorias a ida y vuelta</label>
      <label v-if="sport.koVuelta" class="chk-inline"><input type="checkbox" :checked="sport.koFinalUnica" @change="setSport(sport, 'koFinalUnica', $event.target.checked)"> La final a partido único</label>
      <div class="row">
        <button class="btn" @click="makeKO">Generar eliminatorias</button>
        <button v-if="ko.length" class="btn ghost" @click="clearKO(sport.id)">Borrar eliminatorias</button>
      </div>
      <p class="note">Clasificados con la tabla actual: {{ qualNames.join(', ') || 'ninguno todavía' }}.</p>
    </div>
    <Matches v-if="ko.length" :matches="ko" :editable="state.admin" by-jornada />
    <p v-else class="empty">Las eliminatorias todavía no se han generado.</p>
  </section>

  <section v-else-if="sub === 'eq'"><h2>Equipos ({{ teams.length }})</h2><Teams :sport="sport" :teams="teams" /></section>

  <section v-else>
    <h2>Ajustes de {{ sport.name }}</h2>
    <div class="box form">
      <label>Día de juego
        <select :value="sport.day" @change="setSport(sport, 'day', +$event.target.value)">
          <option v-for="d in 5" :key="d" :value="d">{{ DAYS[d] }}</option>
        </select>
      </label>
      <label>Hora
        <input type="time" :value="sport.time" @change="setSport(sport, 'time', $event.target.value)">
      </label>
      <label>Pistas (separadas por comas)
        <input :value="sport.courts.join(', ')" @change="setCourts($event.target.value)">
      </label>
      <label class="chk-inline"><input type="checkbox" :checked="sport.vuelta" @change="setSport(sport, 'vuelta', $event.target.checked)"> Ida y vuelta en la fase de liga o grupos</label>
      <p class="note">Estos ajustes se aplican al generar el calendario. Cada partido se puede editar luego en "Calendario".</p>
    </div>
  </section>
</template>
