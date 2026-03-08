<template>
  <BottomNav />
  <div class="app-main">
    <RouterView />
  </div>
  <WordDetailModal :wordId="session.modalWordId" @close="session.closeModal()" />
</template>

<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useTheme } from '@/composables/useTheme'
import BottomNav from '@/components/BottomNav.vue'
import WordDetailModal from '@/components/WordDetailModal.vue'
import '@/../style.css'

const session = useSessionStore()

useTheme()
</script>
