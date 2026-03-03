<template>
  <nav class="bottom-nav">
    <div class="bottom-nav-inner">
      <button
        v-for="item in items"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        {{ item.label }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const items = [
  { path: '/', icon: '&#127968;', label: 'Home' },
  { path: '/topics', icon: '&#127991;', label: 'Topics' },
  { path: '/words', icon: '&#128218;', label: 'Words' },
  { path: '/reading', icon: '&#128196;', label: 'Read' },
  { path: '/settings', icon: '&#9881;', label: 'Settings' }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/' || route.path === '/study'
  return route.path.startsWith(path)
}
</script>
