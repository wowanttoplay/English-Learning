import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { WordIndex } from './lib/word-index'
import { WORD_LIST } from './data/words'
import { AudioPlayer } from './lib/audio'
import { loadUserWords } from './lib/user-words'

WordIndex.build(WORD_LIST)
const userWords = loadUserWords()
for (const w of userWords) {
  WordIndex.addWord(w)
}
AudioPlayer.init()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
