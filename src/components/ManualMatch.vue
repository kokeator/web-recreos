<script setup>
import { ref, watch } from 'vue'
import { state, addMatch } from '../store'
import { addDays } from '../lib/league'

const p = defineProps({ sport: Object, teams: Array, matches: Array })
const jornada = ref(Math.max(1, ...p.matches.map(m => m.jornada)))
const homeId = ref(''), awayId = ref('')
const time = ref(p.sport.time), court = ref(p.sport.courts[0] || ''), date = ref('')
const defaultDate = () => addDays(state.data.start, p.sport.day - 1 + 7 * (jornada.value - 1))
date.value = defaultDate()
watch(jornada, () => { date.value = defaultDate() })

function add() {
  if (!homeId.value || !awayId.value) return window.alert('Elige los dos equipos.')
  if (homeId.value === awayId.value) return window.alert('Un equipo no puede jugar contra sí mismo.')
  addMatch(p.sport.id, { jornada: jornada.value, homeId: homeId.value, awayId: awayId.value, date: date.value, time: time.value, court: court.value })
  homeId.value = ''; awayId.value = ''
}
</script>

<template>
  <form class="box form manual" @submit.prevent="add">
    <b>Añadir partido a mano</b>
    <label>Jornada <input v-model.number="jornada" type="number" min="1"></label>
    <label>Local
      <select v-model="homeId"><option value="" disabled>Elige equipo</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select>
    </label>
    <label>Visitante
      <select v-model="awayId"><option value="" disabled>Elige equipo</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select>
    </label>
    <label>Fecha <input v-model="date" type="date"></label>
    <label>Hora <input v-model="time" type="time"></label>
    <label>Pista
      <input v-model="court" list="courts-list" placeholder="Pista">
      <datalist id="courts-list"><option v-for="c in sport.courts" :key="c" :value="c" /></datalist>
    </label>
    <button class="btn">Añadir partido</button>
  </form>
</template>
