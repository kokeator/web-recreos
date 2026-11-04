<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, load, login, logout, sportById } from './store'
import Home from './components/Home.vue'
import SportView from './components/SportView.vue'

const view = ref(location.hash.slice(1) || 'home')
addEventListener('hashchange', () => { view.value = location.hash.slice(1) || 'home'; scrollTo(0, 0) })
const sport = computed(() => sportById(view.value))

const theme = ref(document.documentElement.dataset.theme || 'light')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  try { localStorage.setItem('liga-theme', theme.value) } catch {}
}

const asking = ref(false), pw = ref(''), err = ref('')
async function doLogin() {
  if (await login(pw.value)) { asking.value = false; pw.value = ''; err.value = '' }
  else err.value = 'Contraseña incorrecta'
}
onMounted(load)
</script>

<template>
  <div :style="{ '--c': sport ? sport.color : 'var(--home)' }">
    <header class="top">
      <button class="theme" :aria-label="theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'" @click="toggleTheme">{{ theme === 'dark' ? '☀️' : '🌙' }}</button>
      <div class="brand">
        <img class="logo" src="/logo.png" alt="Torneo C.E. 2026-27" width="112" height="112">
        <div>
          <h1>Liga de Recreos</h1>
          <p>Clasificaciones, calendario, resultados y pistas.</p>
        </div>
      </div>
      <div class="adminbar">
        <template v-if="state.mode === 'demo'"><span class="chip">Modo demo: los datos solo se guardan en este navegador</span></template>
        <template v-if="state.admin">
          <span class="chip on">Modo organizador</span>
          <span class="status">{{ state.status }}</span>
          <button v-if="state.mode === 'online'" class="btn ghost sm" @click="logout">Salir</button>
        </template>
        <button v-else-if="state.mode === 'online' && !asking" class="btn ghost sm" @click="asking = true">Acceso organizadores</button>
        <form v-if="asking && !state.admin" class="row" @submit.prevent="doLogin">
          <input v-model="pw" type="password" placeholder="Contraseña" autofocus>
          <button class="btn sm">Entrar</button><span class="err">{{ err }}</span>
        </form>
      </div>
    </header>

    <nav><div class="tabs">
      <a class="tab" href="#home" :aria-current="!sport">🏠 Inicio</a>
      <a v-for="s in state.data.sports" :key="s.id" class="tab" :href="'#' + s.id"
         :aria-current="view === s.id" :style="{ '--c': s.color }">{{ s.icon }} {{ s.name }}</a>
    </div></nav>

    <main>
      <p v-if="state.mode === 'loading'" class="empty">Cargando…</p>
      <p v-else-if="state.mode === 'error'" class="empty">No se pueden cargar los datos. Revisa que la base Redis esté conectada en Vercel.</p>
      <SportView v-else-if="sport" :key="sport.id" :sport="sport" />
      <Home v-else />
    </main>
  </div>
</template>
