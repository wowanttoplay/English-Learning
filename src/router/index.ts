import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('@/views/DashboardView.vue') },
    { path: '/study', component: () => import('@/views/StudyView.vue') },
{ path: '/words', component: () => import('@/views/WordListView.vue') },
    { path: '/reading', component: () => import('@/views/ReadingView.vue') },
    { path: '/reading/:id', component: () => import('@/views/PassageView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') }
  ]
})

export default router
