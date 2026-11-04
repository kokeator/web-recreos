<script setup>
import { ref, computed } from 'vue'
import { state, teamsOf, generate, setSport } from '../store'
import { standings } from '../lib/league'
import Standings from './Standings.vue'
import Matches from './Matches.vue'
import Teams from './Teams.vue'
import ManualMatch from './ManualMatch.vue'

const p = defineProps({ sport: Object })
const sub = ref('clas')
const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const teams = computed(() => teamsOf(p.sport.id))
const matches = computed(() => state.data.matches
  .filter(m => m.sportId === p.sport.id)
  .sort((a, b) => a.jornada - b.jornada || a.time.localeCompare(b.time)))
const rows = computed(() => standings(teams.value, matches.value))
const tabs = computed(() => [['clas', 'Clasificación'], ['cal', 'Calendario y resultados'], ['eq', 'Equipos y jugadores'], ...(state.admin ? [['aj', 'Ajustes']] : [])])

function regen() {
  if (teams.value.length < 2) return window.alert('Añade al menos 2 equipos.')
  if (matches.value.length && !window.confirm('Se borrará el calendario y los resultados de este deporte. ¿Continuar?')) return
  generate(p.sport.id)
}
const setCourts = v => setSport(p.sport, 'courts', v.split(',').map(s => s.trim()).filter(Boolean))
</script>

<template>
  <div class="band"></div>
  <div class="sub-row">
    <button v-for="[k, l] in tabs" :key="k" class="sub" :aria-current="sub === k" @click="sub = k">{{ l }}</button>
  </div>

  <section v-if="sub === 'clas'"><h2>Clasificación</h2><Standings :rows="rows" /></section>

  <section v-else-if="sub === 'cal'">
    <h2>Calendario</h2>
    <template v-if="state.admin">
      <p class="note">Puedes crear el calendario tú, partido a partido, o generarlo solo con todos contra todos.</p>
      <ManualMatch :sport="sport" :teams="teams" :matches="matches" />
      <button class="btn ghost" @click="regen">{{ matches.length ? 'Regenerar calendario automático' : 'Generar calendario automático' }}</button>
    </template>
    <Matches :matches="matches" :editable="state.admin" by-jornada />
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
      <p class="note">Estos ajustes se aplican al generar el calendario. Cada partido se puede editar luego en "Calendario".</p>
    </div>
  </section>
</template>
