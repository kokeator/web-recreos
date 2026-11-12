<script setup>
import { ref } from 'vue'
import { state, addTeam, removeTeam, addPlayer, removePlayer, setGroup, splitGroups, clearGroups, GROUPS } from '../store'

const p = defineProps({ sport: Object, teams: Array })
const name = ref(''), np = ref({}), n = ref(2), random = ref(true)
const del = t => { if (window.confirm(`¿Eliminar "${t.name}" y sus partidos?`)) removeTeam(t.id) }
const submitTeam = () => { addTeam(p.sport.id, name.value); name.value = '' }
const submitPlayer = t => { addPlayer(t, np.value[t.id]); np.value[t.id] = '' }
function split() {
  if (p.teams.length < 2) return window.alert('Añade al menos 2 equipos.')
  if (p.teams.some(t => t.group) && !window.confirm('Se cambiarán los grupos actuales. ¿Continuar?')) return
  splitGroups(p.sport.id, Math.min(n.value || 2, p.teams.length, GROUPS.length), random.value)
}
</script>

<template>
  <form v-if="state.admin" class="row" @submit.prevent="submitTeam">
    <input v-model="name" placeholder="Nombre del equipo o pareja" required>
    <button class="btn">Añadir equipo</button>
  </form>

  <div v-if="state.admin && teams.length > 1" class="box form grp">
    <b>Fase de grupos (opcional)</b>
    <label>Número de grupos <input v-model.number="n" type="number" min="2" :max="GROUPS.length"></label>
    <label class="chk"><input v-model="random" type="checkbox"> Repartir al azar</label>
    <div class="row">
      <button type="button" class="btn sm" @click="split">Repartir en grupos</button>
      <button type="button" class="btn ghost sm" @click="clearGroups(sport.id)">Quitar grupos</button>
    </div>
    <p class="note">También puedes elegir el grupo de cada equipo a mano. Al generar el calendario, se juega todos contra todos dentro de cada grupo.</p>
  </div>

  <p v-if="!teams.length" class="empty">Todavía no hay equipos en este deporte.</p>
  <div class="team-grid">
    <article v-for="t in teams" :key="t.id" class="team">
      <div class="th">
        <h3>{{ t.name }}</h3>
        <span v-if="t.group && !state.admin" class="chip gchip">Grupo {{ t.group }}</span>
        <button v-if="state.admin" class="x" @click="del(t)">Eliminar</button>
      </div>
      <label v-if="state.admin" class="grpsel">Grupo
        <select :value="t.group || ''" @change="setGroup(t, $event.target.value)">
          <option value="">Sin grupo</option>
          <option v-for="g in GROUPS" :key="g" :value="g">Grupo {{ g }}</option>
        </select>
      </label>
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
