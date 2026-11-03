<script setup>
defineProps({ rows: Array })
</script>

<template>
  <p v-if="!rows.length" class="empty">Añade equipos para ver la clasificación.</p>
  <div v-else class="box">
    <table>
      <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="r.id">
          <td>{{ i + 1 }}</td><td>{{ r.name }}</td><td>{{ r.pj }}</td><td>{{ r.g }}</td><td>{{ r.e }}</td><td>{{ r.p }}</td>
          <td>{{ r.gf }}</td><td>{{ r.gc }}</td><td>{{ r.gf - r.gc > 0 ? '+' : '' }}{{ r.gf - r.gc }}</td><td class="pts">{{ r.pts }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="note">Victoria 3 puntos · empate 1 · derrota 0.</p>
</template>
