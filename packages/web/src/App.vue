<template>
  <BottomNav />
  <div class="app-main">
    <RouterView />
  </div>
  <WordDetailModal :wordId="ui.modalWordId" @close="ui.closeModal()" />
</template>

<script setup lang="ts">
import { useUiStateStore } from '@/stores/uiState'
import { useTheme } from '@/composables/useTheme'
import BottomNav from '@/components/BottomNav.vue'
import WordDetailModal from '@/components/WordDetailModal.vue'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'

const ui = useUiStateStore()

useTheme()
</script>
