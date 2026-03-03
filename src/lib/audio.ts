import { DictAPI } from './dict-api'
import { Storage } from './storage'

const NORMAL_RATE = 0.85
const SLOW_RATE = 0.6
const SENTENCE_RATE = 0.85

let preferredVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

// --- Settings persistence ---

// --- Voice selection ---

function selectVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  const enUS = voices.filter(v => v.lang === 'en-US')
  const en = voices.filter(v => v.lang.startsWith('en'))

  if (enUS.length > 0) {
    const local = enUS.filter(v => v.localService)
    return local.length > 0 ? local[0] : enUS[0]
  }
  if (en.length > 0) {
    const local = en.filter(v => v.localService)
    return local.length > 0 ? local[0] : en[0]
  }

  return voices[0] || null
}

function initVoices(): void {
  if (!('speechSynthesis' in window)) return

  const trySelect = () => {
    preferredVoice = selectVoice()
    if (preferredVoice) voicesLoaded = true
  }

  trySelect()

  if (!voicesLoaded) {
    window.speechSynthesis.addEventListener('voiceschanged', trySelect)
  }
}

// --- Tier 1: dictionaryapi.dev audio ---

function getAudioUrl(word: string): string | null {
  const cached = DictAPI.getCached(word)
  if (!cached || !cached.phonetics) return null

  for (const p of cached.phonetics) {
    if (p.audio && p.audio.length > 0) {
      return p.audio
    }
  }
  return null
}

function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.addEventListener('ended', () => resolve())
    audio.addEventListener('error', reject)
    audio.play().catch(reject)
  })
}

// --- Tier 2: Web Speech API ---

function speakText(text: string, rate?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('speechSynthesis not available'))
      return
    }

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = rate || NORMAL_RATE

    if (preferredVoice) {
      utter.voice = preferredVoice
    }

    utter.addEventListener('end', () => resolve())
    utter.addEventListener('error', (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve()
      } else {
        reject(e)
      }
    })

    window.speechSynthesis.speak(utter)
  })
}

// --- Public API ---

async function playWord(word: string, speed?: 'normal' | 'slow'): Promise<void> {
  const rate = speed === 'slow' ? SLOW_RATE : NORMAL_RATE

  const audioUrl = getAudioUrl(word)
  if (audioUrl) {
    try {
      if (speed !== 'slow') {
        await playAudioUrl(audioUrl)
        return
      }
    } catch {
      // Fall through to Tier 2
    }
  }

  try {
    await speakText(word, rate)
  } catch {
    // Tier 3: No audio available
  }
}

async function playSentence(text: string, speed?: 'normal' | 'slow'): Promise<void> {
  const rate = speed === 'slow' ? SLOW_RATE : SENTENCE_RATE
  try {
    await speakText(text, rate)
  } catch {
    // No audio available
  }
}

function preload(word: string): void {
  if (!DictAPI.getCached(word)) {
    DictAPI.lookup(word).catch(() => {})
  }
}

function isAvailable(): boolean {
  return 'speechSynthesis' in window
}

function setAutoPlay(enabled: boolean): void {
  const settings = Storage.loadAudioSettings()
  settings.autoPlay = !!enabled
  Storage.saveAudioSettings(settings)
}

function getAutoPlay(): boolean {
  return Storage.loadAudioSettings().autoPlay
}

function stop(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export const AudioPlayer = {
  playWord,
  playSentence,
  preload,
  isAvailable,
  setAutoPlay,
  getAutoPlay,
  stop,
  init: initVoices
}
