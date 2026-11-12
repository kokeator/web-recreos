<script setup>
defineProps({ rows: Array, title: String })
</script>

<template>
  <h3 v-if="title" class="gt">{{ title }}</h3>
  <div class="box">
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
</template>
