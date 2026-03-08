/**
 * Generate MP3 audio files for passages using Google Cloud Text-to-Speech.
 *
 * Setup:
 *   1. Go to Google Cloud Console → create/select a project
 *   2. Enable "Cloud Text-to-Speech API"
 *   3. Create a service account → download the JSON key file
 *   4. export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *   5. npm run generate-tts
 *
 * Options:
 *   --force   Regenerate all files, even if they already exist
 */

import { resolve, dirname } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Resolve project root (scripts/ is one level down)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')

// Dynamic import of passages data — tsx handles the @/ alias via tsconfig
async function loadPassages() {
  // Use relative path from project root
  const mod = await import(resolve(PROJECT_ROOT, 'src/data/passages.ts'))
  return mod.PASSAGES as Array<{ id: number; title: string; text: string }>
}

async function main() {
  const force = process.argv.includes('--force')

  // Import Google Cloud TTS client
  // Auth: uses gcloud application-default credentials or GOOGLE_APPLICATION_CREDENTIALS
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')
  const client = new TextToSpeechClient()

  const passages = await loadPassages()
  const outputDir = resolve(PROJECT_ROOT, 'public/audio')
  mkdirSync(outputDir, { recursive: true })

  console.log(`Found ${passages.length} passages. Output: ${outputDir}\n`)

  let generated = 0
  let skipped = 0

  for (const passage of passages) {
    const outPath = resolve(outputDir, `passage-${passage.id}.mp3`)

    if (!force && existsSync(outPath)) {
      console.log(`  [skip] passage-${passage.id}.mp3 (already exists)`)
      skipped++
      continue
    }

    console.log(`  [gen]  passage-${passage.id}.mp3 — "${passage.title}"`)

    const [response] = await client.synthesizeSpeech({
      input: { text: passage.text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-J',
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.92,
        sampleRateHertz: 24000,
      },
    })

    if (response.audioContent) {
      const buffer = response.audioContent instanceof Uint8Array
        ? Buffer.from(response.audioContent)
        : Buffer.from(response.audioContent as string, 'base64')
      writeFileSync(outPath, buffer)
      generated++
    } else {
      console.error(`    Warning: No audio content returned for passage ${passage.id}`)
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
