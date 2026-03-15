import { DictAPI } from './dict-api'

const NORMAL_RATE = 0.85
const SLOW_RATE = 0.6
const SENTENCE_RATE = 0.85

function getAudioBase(): string {
  return import.meta.env.VITE_AUDIO_BASE_URL || (import.meta.env.BASE_URL + 'audio')
}

const AUDIO_CACHE_MAX = 100
const audioElementCache = new Map<string, HTMLAudioElement>()

let preferredVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

// --- Settings persistence ---

const AUDIO_SETTINGS_KEY = 'settings_audio'

interface AudioSettings {
  autoPlay: boolean
}

function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { autoPlay: true }
}

function saveAudioSettings(settings: AudioSettings): void {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings))
}

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

function playAudioUrl(url: string, word?: string, playbackRate?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = (word && audioElementCache.get(word)) || new Audio(url)
    audio.currentTime = 0
    audio.playbackRate = playbackRate || 1.0
    audio.addEventListener('ended', () => resolve(), { once: true })
    audio.addEventListener('error', reject, { once: true })
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

async function playWord(word: string, speed?: 'normal' | 'slow', wordId?: number): Promise<void> {
  const rate = speed === 'slow' ? SLOW_RATE : NORMAL_RATE
  const playbackRate = speed === 'slow' ? SLOW_RATE / NORMAL_RATE : 1.0

  // Tier 1: dictionaryapi.dev audio
  const audioUrl = getAudioUrl(word)
  if (audioUrl) {
    try {
      await playAudioUrl(audioUrl, word, playbackRate)
      return
    } catch {
      // Fall through
    }
  }

  // Tier 2: Generated Chirp 3 HD MP3 from R2
  if (wordId) {
    try {
      await playAudioUrl(`${getAudioBase()}/words/word-${wordId}.mp3`, undefined, playbackRate)
      return
    } catch {
      // Fall through
    }
  }

  // Tier 3: Web Speech API
  try {
    await speakText(word, rate)
  } catch {
    // No audio
  }
}

async function playSentence(text: string, speed?: 'normal' | 'slow', wordId?: number, exIndex?: number): Promise<void> {
  const rate = speed === 'slow' ? SLOW_RATE : SENTENCE_RATE

  // Tier 1: Generated Chirp 3 HD MP3 from R2
  if (wordId !== undefined && exIndex !== undefined) {
    try {
      const playbackRate = speed === 'slow' ? SLOW_RATE / SENTENCE_RATE : 1.0
      await playAudioUrl(`${getAudioBase()}/examples/word-${wordId}-ex${exIndex + 1}.mp3`, undefined, playbackRate)
      return
    } catch {
      // Fall through
    }
  }

  // Tier 2: Web Speech API
  try {
    await speakText(text, rate)
  } catch {
    // No audio
  }
}

async function preload(word: string): Promise<void> {
  if (!DictAPI.getCached(word)) {
    await DictAPI.lookup(word).catch(() => {})
  }
  // Pre-buffer dictionaryapi.dev audio
  const url = getAudioUrl(word)
  if (url && !audioElementCache.has(word)) {
    if (audioElementCache.size >= AUDIO_CACHE_MAX) {
      const oldest = audioElementCache.keys().next().value!
      audioElementCache.delete(oldest)
    }
    const el = new Audio()
    el.preload = 'auto'
    el.src = url
    el.load()
    audioElementCache.set(word, el)
  }
}

function isAvailable(): boolean {
  return 'speechSynthesis' in window
}

function setAutoPlay(enabled: boolean): void {
  const settings = loadAudioSettings()
  settings.autoPlay = !!enabled
  saveAudioSettings(settings)
}

function getAutoPlay(): boolean {
  return loadAudioSettings().autoPlay
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
