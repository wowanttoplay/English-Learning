// AudioPlayer Module
// 3-tier audio fallback: dictionaryapi.dev audio > Web Speech API > phonetic display
// Must be loaded after dict-api.js, before app.js

const AudioPlayer = (() => {
  const SETTINGS_KEY = 'settings_audio';

  const NORMAL_RATE = 0.85;
  const SLOW_RATE = 0.6;
  const SENTENCE_RATE = 0.85;

  let preferredVoice = null;
  let voicesLoaded = false;

  // --- Settings persistence ---

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { autoPlay: true };
    } catch (e) {
      return { autoPlay: true };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }

  // --- Voice selection ---

  function selectVoice() {
    if (!('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Prefer en-US voices, then any en voice
    const enUS = voices.filter(v => v.lang === 'en-US');
    const en = voices.filter(v => v.lang.startsWith('en'));

    // Prefer non-network voices for speed, but accept any
    if (enUS.length > 0) {
      // Prefer local voices (not remote/network)
      const local = enUS.filter(v => v.localService);
      return local.length > 0 ? local[0] : enUS[0];
    }
    if (en.length > 0) {
      const local = en.filter(v => v.localService);
      return local.length > 0 ? local[0] : en[0];
    }

    return voices[0] || null;
  }

  function initVoices() {
    if (!('speechSynthesis' in window)) return;

    const trySelect = () => {
      preferredVoice = selectVoice();
      if (preferredVoice) voicesLoaded = true;
    };

    trySelect();

    // Voices may load asynchronously
    if (!voicesLoaded) {
      window.speechSynthesis.addEventListener('voiceschanged', trySelect);
    }
  }

  // --- Tier 1: dictionaryapi.dev audio ---

  function getAudioUrl(word) {
    if (typeof DictAPI === 'undefined') return null;
    const cached = DictAPI.getCached(word);
    if (!cached || !cached.phonetics) return null;

    for (const p of cached.phonetics) {
      if (p.audio && p.audio.length > 0) {
        return p.audio;
      }
    }
    return null;
  }

  function playAudioUrl(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.addEventListener('ended', resolve);
      audio.addEventListener('error', reject);
      audio.play().catch(reject);
    });
  }

  // --- Tier 2: Web Speech API ---

  function speakText(text, rate) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('speechSynthesis not available'));
        return;
      }

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = rate || NORMAL_RATE;

      if (preferredVoice) {
        utter.voice = preferredVoice;
      }

      utter.addEventListener('end', resolve);
      utter.addEventListener('error', (e) => {
        // 'interrupted' or 'canceled' are not real errors
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolve();
        } else {
          reject(e);
        }
      });

      window.speechSynthesis.speak(utter);
    });
  }

  // --- Public API ---

  /**
   * Play word pronunciation with 3-tier fallback
   * @param {string} word - The word to pronounce
   * @param {string} speed - 'normal' or 'slow'
   */
  async function playWord(word, speed) {
    const rate = speed === 'slow' ? SLOW_RATE : NORMAL_RATE;

    // Tier 1: Try dictionaryapi.dev audio
    const audioUrl = getAudioUrl(word);
    if (audioUrl) {
      try {
        if (speed === 'slow') {
          // Audio element doesn't support playback rate easily on all browsers
          // Fall through to TTS for slow playback
        } else {
          await playAudioUrl(audioUrl);
          return;
        }
      } catch (e) {
        // Fall through to Tier 2
      }
    }

    // Tier 2: Web Speech API
    try {
      await speakText(word, rate);
      return;
    } catch (e) {
      // Tier 3: No audio available - caller should show phonetic
    }
  }

  /**
   * Play sentence via TTS (Web Speech API only)
   * @param {string} text - Sentence to read
   * @param {string} speed - 'normal' or 'slow'
   */
  async function playSentence(text, speed) {
    const rate = speed === 'slow' ? SLOW_RATE : SENTENCE_RATE;
    try {
      await speakText(text, rate);
    } catch (e) {
      // No audio available
    }
  }

  /**
   * Pre-fetch dictionary data (and thus audio URL) for a word
   * @param {string} word - The word to preload
   */
  function preload(word) {
    if (typeof DictAPI !== 'undefined' && !DictAPI.getCached(word)) {
      DictAPI.lookup(word).catch(() => {});
    }
  }

  /**
   * Check if any audio playback method is available
   * @returns {boolean}
   */
  function isAvailable() {
    return 'speechSynthesis' in window;
  }

  /**
   * Toggle auto-play setting
   * @param {boolean} enabled
   */
  function setAutoPlay(enabled) {
    const settings = loadSettings();
    settings.autoPlay = !!enabled;
    saveSettings(settings);
  }

  /**
   * Get auto-play setting
   * @returns {boolean}
   */
  function getAutoPlay() {
    return loadSettings().autoPlay;
  }

  /**
   * Get the preferred en-US voice
   * @returns {SpeechSynthesisVoice|null}
   */
  function getPreferredVoice() {
    return preferredVoice;
  }

  /**
   * Stop any currently playing audio
   */
  function stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Initialize voices
  initVoices();

  return {
    playWord,
    playSentence,
    preload,
    isAvailable,
    setAutoPlay,
    getAutoPlay,
    getPreferredVoice,
    stop
  };
})();
