import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { WordIndex } from './lib/word-index'
import { WORD_LIST } from './data/words'
import { AudioPlayer } from './lib/audio'

WordIndex.build(WORD_LIST)
AudioPlayer.init()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
