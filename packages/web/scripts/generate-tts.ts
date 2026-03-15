/**
 * Generate MP3 audio files + sentence timestamps using Google Cloud Text-to-Speech.
 *
 * For passages, uses SSML <mark> tags to get sentence-level timepoints in a single
 * TTS call — no separate STT/Whisper step needed.
 *
 * Output:
 *   - Passages:  public/audio/passages/passage-{id}.mp3 + passage-{id}.timestamps.json
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
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(PROJECT_ROOT, '..', 'api', 'scripts', 'data')

function loadPassages() {
  const passagesDir = resolve(DATA_DIR, 'passages')
  const files = readdirSync(passagesDir).filter(f => f.endsWith('.json'))
  return files.flatMap(f => {
    const raw = readFileSync(resolve(passagesDir, f), 'utf-8')
    return JSON.parse(raw) as Array<{ id: number; title: string; text: string }>
  })
}

async function loadSplitter() {
  const mod = await import(pathToFileURL(resolve(PROJECT_ROOT, 'src/lib/sentence-splitter.ts')).href)
  return mod.splitSentences as (text: string, _lang?: string) => Array<{ index: number; text: string; start: number; end: number }>
}

function loadWords() {
  const wordsDir = resolve(DATA_DIR, 'words')
  const files = readdirSync(wordsDir).filter(f => f.endsWith('.json'))
  return files.flatMap(f => {
    const raw = readFileSync(resolve(wordsDir, f), 'utf-8')
    return JSON.parse(raw) as Array<{ id: number; word: string; examples: string[] }>
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface TimestampEntry {
  index: number
  start: number
  end: number
  text: string
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null

  const doPassages = !only || only === 'passages'
  const doWords = !only || only === 'words'
  const doExamples = !only || only === 'examples'

  // Use v1beta1 for enable_time_pointing support
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech/build/src/v1beta1')
  const client = new TextToSpeechClient()

  let generated = 0
  let skipped = 0

  // --- Passages (with timestamps) ---
  if (doPassages) {
    const passages = loadPassages()
    const splitSentences = await loadSplitter()
    const audioDir = resolve(PROJECT_ROOT, 'public/audio/passages')
    mkdirSync(audioDir, { recursive: true })
    console.log(`\n=== Passages (${passages.length}) ===`)

    for (const p of passages) {
      const mp3Path = resolve(audioDir, `passage-${p.id}.mp3`)
      const tsPath = resolve(audioDir, `passage-${p.id}.timestamps.json`)
      if (!force && existsSync(mp3Path) && existsSync(tsPath)) {
        skipped++
        continue
      }

      console.log(`  [gen] passage-${p.id} — "${p.title}"`)

      // Split text into sentences
      const sentences = splitSentences(p.text)

      // Build SSML with <mark> before each sentence
      let ssml = '<speak>'
      for (const s of sentences) {
        ssml += `<mark name="s${s.index}"/>${escapeXml(s.text)} `
      }
      ssml += '</speak>'

      try {
        const [response] = await client.synthesizeSpeech({
          input: { ssml },
          voice: { languageCode: 'en-US', name: 'en-US-Neural2-J' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92, sampleRateHertz: 24000 },
          enableTimePointing: ['SSML_MARK'],
        })

        // Write MP3
        if (response.audioContent) {
          const buffer = response.audioContent instanceof Uint8Array
            ? Buffer.from(response.audioContent)
            : Buffer.from(response.audioContent as string, 'base64')
          writeFileSync(mp3Path, buffer)
        } else {
          console.error(`    Warning: no audio for passage ${p.id}`)
          continue
        }

        // Build timestamps from timepoints
        const timepoints = (response.timepoints ?? []) as Array<{ markName: string; timeSeconds: number }>
        const timestamps: TimestampEntry[] = []

        for (let i = 0; i < sentences.length; i++) {
          const tp = timepoints.find(t => t.markName === `s${i}`)
          const nextTp = timepoints.find(t => t.markName === `s${i + 1}`)
          const start = tp?.timeSeconds ?? 0
          // If no next mark, estimate end from audio duration or use a fallback
          const end = nextTp?.timeSeconds ?? (start + 5)

          timestamps.push({
            index: i,
            start: Math.round(start * 100) / 100,
            end: Math.round(end * 100) / 100,
            text: sentences[i].text,
          })
        }

        writeFileSync(tsPath, JSON.stringify(timestamps, null, 2))
        console.log(`    ✓ MP3 + ${timestamps.length} timestamps`)
        generated++
      } catch (err) {
        console.error(`    Error: ${err}`)
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
            voice: { languageCode: 'en-US', name: 'en-US-Neural2-J' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, sampleRateHertz: 24000 },
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
              voice: { languageCode: 'en-US', name: 'en-US-Neural2-J' },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 0.90, sampleRateHertz: 24000 },
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
