<template>
  <RouterView />
  <BottomNav v-if="showNav" />
  <WordDetailModal :wordId="session.modalWordId" @close="session.closeModal()" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useTheme } from '@/composables/useTheme'
import BottomNav from '@/components/BottomNav.vue'
import WordDetailModal from '@/components/WordDetailModal.vue'
import '@/../style.css'

const route = useRoute()
const session = useSessionStore()

useTheme()

const showNav = computed(() => {
  return route.path !== '/study' && !route.path.startsWith('/reading/')
})
</script>
