<script setup>
import { ref } from 'vue'
import { state, addTeam, removeTeam, addPlayer, removePlayer } from '../store'

const p = defineProps({ sport: Object, teams: Array })
const name = ref(''), np = ref({})
const del = t => { if (window.confirm(`¿Eliminar "${t.name}" y sus partidos?`)) removeTeam(t.id) }
const submitTeam = () => { addTeam(p.sport.id, name.value); name.value = '' }
const submitPlayer = t => { addPlayer(t, np.value[t.id]); np.value[t.id] = '' }
</script>

<template>
  <form v-if="state.admin" class="row" @submit.prevent="submitTeam">
    <input v-model="name" placeholder="Nombre del equipo o pareja" required>
    <button class="btn">Añadir equipo</button>
  </form>
  <p v-if="!teams.length" class="empty">Todavía no hay equipos en este deporte.</p>
  <div class="team-grid">
    <article v-for="t in teams" :key="t.id" class="team">
      <div class="th"><h3>{{ t.name }}</h3><button v-if="state.admin" class="x" @click="del(t)">Eliminar</button></div>
      <ul>
        <li v-for="(pl, i) in t.players" :key="i">{{ pl }}<button v-if="state.admin" class="x" :aria-label="'Quitar ' + pl" @click="removePlayer(t, i)">✕</button></li>
      </ul>
      <p v-if="!t.players.length" class="note">Sin jugadores apuntados.</p>
      <form v-if="state.admin" class="row" @submit.prevent="submitPlayer(t)">
        <input v-model="np[t.id]" placeholder="Nombre del jugador">
        <button class="btn sm">Añadir</button>
      </form>
    </article>
  </div>
</template>
