/**
 * Generate MP3 audio files using Google Cloud Text-to-Speech.
 *
 * Generates audio for:
 *   - Passages:  public/audio/passages/passage-{id}.mp3
 *   - Words:     public/audio/words/word-{id}.mp3
 *   - Examples:  public/audio/examples/word-{id}-ex1.mp3, word-{id}-ex2.mp3
 *
 * Auth: gcloud auth application-default login
 *       OR export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *
 * Usage:
 *   npm run generate-tts                  # Generate all (skip existing)
 *   npm run generate-tts -- --force       # Regenerate all
 *   npm run generate-tts -- --only passages
 *   npm run generate-tts -- --only words
 *   npm run generate-tts -- --only examples
 */

import { resolve, dirname } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')

async function loadPassages() {
  const mod = await import(resolve(PROJECT_ROOT, 'src/data/passages.ts'))
  return mod.PASSAGES as Array<{ id: number; title: string; text: string }>
}

async function loadWords() {
  const mod = await import(resolve(PROJECT_ROOT, 'src/data/words.ts'))
  return mod.WORD_LIST as Array<{ id: number; word: string; examples: string[] }>
}

interface TtsClient {
  synthesizeSpeech(request: {
    input: { text: string }
    voice: { languageCode: string; name: string }
    audioConfig: { audioEncoding: string; speakingRate: number; sampleRateHertz: number }
  }): Promise<[{ audioContent?: Uint8Array | string }]>
}

async function synthesize(client: TtsClient, text: string, outPath: string, speakingRate: number): Promise<boolean> {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-J',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      sampleRateHertz: 24000,
    },
  })

  if (response.audioContent) {
    const buffer = response.audioContent instanceof Uint8Array
      ? Buffer.from(response.audioContent)
      : Buffer.from(response.audioContent as string, 'base64')
    writeFileSync(outPath, buffer)
    return true
  }
  return false
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null

  const doPassages = !only || only === 'passages'
  const doWords = !only || only === 'words'
  const doExamples = !only || only === 'examples'

  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')
  const client = new TextToSpeechClient() as unknown as TtsClient

  let generated = 0
  let skipped = 0

  // --- Passages ---
  if (doPassages) {
    const passages = await loadPassages()
    const dir = resolve(PROJECT_ROOT, 'public/audio/passages')
    mkdirSync(dir, { recursive: true })
    console.log(`\n=== Passages (${passages.length}) ===`)

    for (const p of passages) {
      const outPath = resolve(dir, `passage-${p.id}.mp3`)
      if (!force && existsSync(outPath)) {
        skipped++
        continue
      }
      console.log(`  [gen] passage-${p.id}.mp3 — "${p.title}"`)
      const ok = await synthesize(client, p.text, outPath, 0.92)
      ok ? generated++ : console.error(`    Warning: no audio for passage ${p.id}`)
    }
  }

  // --- Words ---
  if (doWords || doExamples) {
    const words = await loadWords()

    if (doWords) {
      const dir = resolve(PROJECT_ROOT, 'public/audio/words')
      mkdirSync(dir, { recursive: true })
      console.log(`\n=== Words (${words.length}) ===`)

      for (const w of words) {
        const outPath = resolve(dir, `word-${w.id}.mp3`)
        if (!force && existsSync(outPath)) {
          skipped++
          continue
        }
        console.log(`  [gen] word-${w.id}.mp3 — "${w.word}"`)
        const ok = await synthesize(client, w.word, outPath, 0.85)
        ok ? generated++ : console.error(`    Warning: no audio for word ${w.id}`)
      }
    }

    if (doExamples) {
      const dir = resolve(PROJECT_ROOT, 'public/audio/examples')
      mkdirSync(dir, { recursive: true })
      console.log(`\n=== Examples (${words.length * 2}) ===`)

      for (const w of words) {
        for (let i = 0; i < Math.min(w.examples.length, 2); i++) {
          const outPath = resolve(dir, `word-${w.id}-ex${i + 1}.mp3`)
          if (!force && existsSync(outPath)) {
            skipped++
            continue
          }
          console.log(`  [gen] word-${w.id}-ex${i + 1}.mp3 — "${w.examples[i].slice(0, 50)}..."`)
          const ok = await synthesize(client, w.examples[i], outPath, 0.90)
          ok ? generated++ : console.error(`    Warning: no audio for word ${w.id} ex${i + 1}`)
        }
      }
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
