/**
 * Generate MP3 audio files + timestamps using Google Cloud Text-to-Speech (Chirp 3 HD).
 *
 * For passages, generates one MP3 per dialogue turn using each speaker's assigned voice.
 * Timestamps are built from cumulative MP3 durations.
 *
 * Output:
 *   - Passages:  public/audio/passages/passage-{id}-turn-{i}.mp3 + passage-{id}.timestamps.json
 *   - Words:     public/audio/words/word-{id}.mp3
 *   - Examples:  public/audio/examples/word-{id}-ex1.mp3, word-{id}-ex2.mp3
 *
 * After generation, upload to R2:
 *   rclone copy public/audio/ r2:$R2_BUCKET/audio/ --progress
 *
 * Auth: gcloud auth application-default login
 *
 * Usage:
 *   npx tsx scripts/generate-tts.ts                  # Generate all (skip existing)
 *   npx tsx scripts/generate-tts.ts --force           # Regenerate all
 *   npx tsx scripts/generate-tts.ts --only passages
 *   npx tsx scripts/generate-tts.ts --only words
 *   npx tsx scripts/generate-tts.ts --only examples
 */

import { resolve, dirname } from 'node:path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(PROJECT_ROOT, '..', 'api', 'scripts', 'data')

interface PassageSource {
  id: number
  title: string
  speakers: Array<{ name: string; voice: string }>
  turns: Array<{ speaker: number; text: string }>
}

function loadPassages(): PassageSource[] {
  const passagesDir = resolve(DATA_DIR, 'passages')
  const files = readdirSync(passagesDir).filter(f => f.endsWith('.json'))
  return files.flatMap(f => {
    const raw = readFileSync(resolve(passagesDir, f), 'utf-8')
    return JSON.parse(raw) as PassageSource[]
  })
}

function loadWords() {
  const wordsDir = resolve(DATA_DIR, 'words')
  const files = readdirSync(wordsDir).filter(f => f.endsWith('.json'))
  return files.flatMap(f => {
    const raw = readFileSync(resolve(wordsDir, f), 'utf-8')
    return JSON.parse(raw) as Array<{ id: number; word: string; examples: string[] }>
  })
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
  const client = new TextToSpeechClient()

  let generated = 0
  let skipped = 0

  // --- Passages (per-turn audio with timestamps) ---
  if (doPassages) {
    const passages = loadPassages()
    const audioDir = resolve(PROJECT_ROOT, 'public/audio/passages')
    mkdirSync(audioDir, { recursive: true })
    console.log(`\n=== Passages (${passages.length}) ===`)

    for (const p of passages) {
      const tsPath = resolve(audioDir, `passage-${p.id}.timestamps.json`)
      const allExist = p.turns.every((_, i) =>
        existsSync(resolve(audioDir, `passage-${p.id}-turn-${i}.mp3`))
      ) && existsSync(tsPath)

      if (!force && allExist) { skipped++; continue }

      console.log(`  [gen] passage-${p.id} — "${p.title}"`)
      const timestamps: Array<{ turn: number; start: number; end: number }> = []
      let cumulative = 0
      let failed = false

      for (let i = 0; i < p.turns.length; i++) {
        const turn = p.turns[i]
        const voice = p.speakers[turn.speaker].voice
        const mp3Path = resolve(audioDir, `passage-${p.id}-turn-${i}.mp3`)

        try {
          const [response] = await client.synthesizeSpeech({
            input: { text: turn.text },
            voice: { languageCode: 'en-US', name: voice },
            audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
          })

          if (!response.audioContent) { failed = true; break }

          const buffer = response.audioContent instanceof Uint8Array
            ? Buffer.from(response.audioContent)
            : Buffer.from(response.audioContent as string, 'base64')
          writeFileSync(mp3Path, buffer)

          // Get MP3 duration using mp3-duration package
          const mp3Dur = (await import('mp3-duration')).default
          const durationSec: number = await new Promise((res, rej) => {
            mp3Dur(mp3Path, (err: Error | null, dur: number) => err ? rej(err) : res(dur))
          })
          timestamps.push({ turn: i, start: Math.round(cumulative * 100) / 100, end: Math.round((cumulative + durationSec) * 100) / 100 })
          cumulative += durationSec
        } catch (err) {
          console.error(`    Error turn ${i}: ${err}`)
          failed = true
          break
        }
      }

      if (failed) {
        for (let i = 0; i < p.turns.length; i++) {
          const mp3 = resolve(audioDir, `passage-${p.id}-turn-${i}.mp3`)
          if (existsSync(mp3)) unlinkSync(mp3)
        }
        console.log(`    ✗ Skipped (error)`)
      } else {
        writeFileSync(tsPath, JSON.stringify(timestamps, null, 2))
        console.log(`    ✓ ${p.turns.length} turns + timestamps`)
        generated++
      }
    }
  }

  // --- Words ---
  if (doWords || doExamples) {
    const words = loadWords()

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
        try {
          const [response] = await client.synthesizeSpeech({
            input: { text: w.word },
            voice: { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Charon' },
            audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
          })
          if (response.audioContent) {
            const buffer = response.audioContent instanceof Uint8Array
              ? Buffer.from(response.audioContent)
              : Buffer.from(response.audioContent as string, 'base64')
            writeFileSync(outPath, buffer)
            generated++
          }
        } catch (err) {
          console.error(`    Error: ${err}`)
        }
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
          try {
            const [response] = await client.synthesizeSpeech({
              input: { text: w.examples[i] },
              voice: { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Charon' },
              audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
            })
            if (response.audioContent) {
              const buffer = response.audioContent instanceof Uint8Array
                ? Buffer.from(response.audioContent)
                : Buffer.from(response.audioContent as string, 'base64')
              writeFileSync(outPath, buffer)
              generated++
            }
          } catch (err) {
            console.error(`    Error: ${err}`)
          }
        }
      }
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`)
  console.log('\nUpload to R2:')
  console.log('  rclone copy public/audio/ r2:$R2_BUCKET/audio/ --progress')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
