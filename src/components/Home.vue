<script setup>
import { computed } from 'vue'
import { state } from '../store'
import Matches from './Matches.vue'

const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const today = new Date().toISOString().slice(0, 10)
const key = m => m.date + m.time
const played = m => m.hs != null && m.as != null
const next = computed(() => state.data.matches.filter(m => !played(m) && m.date >= today).sort((a, b) => key(a).localeCompare(key(b))).slice(0, 8))
const last = computed(() => state.data.matches.filter(played).sort((a, b) => key(b).localeCompare(key(a))).slice(0, 6))
</script>

<template>
  <h2>Próximos partidos</h2>
  <Matches :matches="next" show-sport />
  <h2>Últimos resultados</h2>
  <Matches :matches="last" show-sport />
  <h2>¿Dónde juega cada deporte?</h2>
  <div class="box">
    <div v-for="s in state.data.sports" :key="s.id" class="court">
      <b><span class="dot" :style="{ background: s.color }"></span>{{ s.name }}</b>
      <span>{{ DAYS[s.day] }} a las {{ s.time }} · {{ s.courts.join(' y ') }}</span>
    </div>
  </div>
</template>
