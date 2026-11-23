<script setup>
import { computed } from 'vue'
import { state, teamName, homeOf, awayOf, winnerId } from '../store'

const props = defineProps({ ko: Array })
const num = v => (v == null ? '–' : v)

// Un cruce = partido de ida (o único) + su vuelta si existe. Cada equipo: nombre, ida, vuelta y global.
function tie(h) {
  const v = state.data.matches.find(x => x.legOf === h.id)
  const H = homeOf(h), A = awayOf(h), w = winnerId(h)
  const done = v ? [h.hs, h.as, v.hs, v.as].every(x => x != null) : h.hs != null && h.as != null
  const side = (id, own, opp, vOwn) => ({
    id, name: teamName(id), tbd: !id,
    l1: num(own), l2: v ? num(vOwn) : null,
    total: done ? (v ? own + vOwn : own) : '–',
    win: Boolean(w) && id === w, lose: Boolean(w) && id !== w,
  })
  return { id: h.id, two: Boolean(v), sides: [side(H, h.hs, h.as, v && v.as), side(A, h.as, h.hs, v && v.hs)] }
}

const cols = computed(() => {
  const rounds = []
  for (const m of props.ko.filter(x => !x.legOf)) {
    let r = rounds.find(x => x.name === m.round)
    if (!r) rounds.push(r = { name: m.round, ties: [] })
    r.ties.push(tie(m))
  }
  return rounds.map(r => {
    const groups = []
    for (let i = 0; i < r.ties.length; i += 2) groups.push(r.ties.slice(i, i + 2))
    return { name: r.name, groups }
  })
})
const twoLeg = computed(() => props.ko.some(m => m.legOf))
</script>

<template>
  <div class="box">
    <div class="bracket">
      <div v-for="(c, ci) in cols" :key="c.name" class="bcol" :class="{ first: ci === 0, last: ci === cols.length - 1 }">
        <h4>{{ c.name }}</h4>
        <div class="brd">
          <div v-for="(g, gi) in c.groups" :key="gi" class="bpair">
            <div v-for="t in g" :key="t.id" class="tie">
              <div v-for="(s, si) in t.sides" :key="si" class="trow" :class="{ win: s.win, lose: s.lose, tbd: s.tbd }">
                <span class="tn">{{ s.name }}</span>
                <span v-if="t.two" class="tl"><i>{{ s.l1 }}</i><i>{{ s.l2 }}</i></span>
                <b class="tg">{{ s.total }}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p v-if="twoLeg" class="note">Números pequeños: ida y vuelta · número grande: global.</p>
</template>
