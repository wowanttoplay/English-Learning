import { AudioPlayer } from '@/lib/audio'

export function useAudio() {
  function speak(word: string, speed?: 'normal' | 'slow') {
    AudioPlayer.playWord(word, speed || 'normal')
  }

  function speakSlow(word: string) {
    AudioPlayer.playWord(word, 'slow')
  }

  function speakSentence(text: string, speed?: 'normal' | 'slow', word?: string, exIndex?: number) {
    AudioPlayer.playSentence(text, speed || 'normal', word, exIndex)
  }

  function autoPlayWord(word: string) {
    if (AudioPlayer.getAutoPlay()) {
      AudioPlayer.playWord(word, 'normal')
    }
  }

  async function preloadWord(word: string): Promise<void> {
    return AudioPlayer.preload(word)
  }

  function stop() {
    AudioPlayer.stop()
  }

  function getAutoPlay(): boolean {
    return AudioPlayer.getAutoPlay()
  }

  function setAutoPlay(enabled: boolean) {
    AudioPlayer.setAutoPlay(enabled)
  }

  function isAvailable(): boolean {
    return AudioPlayer.isAvailable()
  }

  return {
    speak,
    speakSlow,
    speakSentence,
    autoPlayWord,
    preloadWord,
    stop,
    getAutoPlay,
    setAutoPlay,
    isAvailable
  }
}
