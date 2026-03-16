import { AudioPlayer } from '@/lib/audio'

export function useAudio() {
  function speak(word: string, speed?: 'normal' | 'slow', wordId?: number) {
    AudioPlayer.playWord(word, speed || 'normal', wordId)
  }

  function speakSlow(word: string, wordId?: number) {
    AudioPlayer.playWord(word, 'slow', wordId)
  }

  function speakSentence(text: string, speed?: 'normal' | 'slow', wordId?: number, exIndex?: number) {
    AudioPlayer.playSentence(text, speed || 'normal', wordId, exIndex)
  }

  function autoPlayWord(word: string, wordId?: number) {
    if (AudioPlayer.getAutoPlay()) {
      AudioPlayer.playWord(word, 'normal', wordId)
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
