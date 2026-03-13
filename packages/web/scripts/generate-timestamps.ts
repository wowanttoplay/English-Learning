/**
 * Generate sentence-level timestamp JSON files for passage audio.
 *
 * Downloads MP3 from Cloudflare R2, sends to OpenAI Whisper API for
 * transcription with timestamps, then aligns Whisper segments to
 * splitSentences() output to ensure index consistency with the UI.
 *
 * Output: JSON files at output/audio/passages/passage-{id}.timestamps.json
 *
 * After generation, upload to R2:
 *   rclone copy output/audio/passages/ r2:$R2_BUCKET/audio/passages/ --include "*.timestamps.json" --progress
 *
 * Auth: export OPENAI_API_KEY="sk-..."
 *
 * Usage:
 *   npm run generate-timestamps                    # Generate all (skip existing)
 *   npm run generate-timestamps -- --force         # Regenerate all
 *   npm run generate-timestamps -- --id 101        # Generate for specific passage
 *   npm run generate-timestamps -- --id 101,102    # Generate for multiple passages
 */

import { resolve, dirname } from 'node:path'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')

const AUDIO_BASE_URL = process.env.VITE_AUDIO_BASE_URL
  || 'https://pub-56950774e76246b39c3df6e3b9d85f5f.r2.dev/audio'

interface WhisperSegment {
  start: number
  end: number
  text: string
}

interface WhisperResponse {
  segments: WhisperSegment[]
  text: string
}

interface TimestampEntry {
  index: number
  start: number
  end: number
  text: string
}

async function loadSplitter() {
  const mod = await import(pathToFileURL(resolve(PROJECT_ROOT, 'src/lib/sentence-splitter.ts')).href)
  return mod.splitSentences as (text: string) => Array<{ index: number; text: string; start: number; end: number }>
}

async function loadPassages() {
  const mod = await import(pathToFileURL(resolve(PROJECT_ROOT, 'src/data/passages.ts')).href)
  return mod.PASSAGES as Array<{ id: number; title: string; text: string }>
}

async function downloadMp3(passageId: number, tmpPath: string): Promise<boolean> {
  const url = `${AUDIO_BASE_URL}/passages/passage-${passageId}.mp3`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`    Failed to download: ${url} (${res.status})`)
      return false
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    writeFileSync(tmpPath, buffer)
    return true
  } catch (err) {
    console.error(`    Download error: ${err}`)
    return false
  }
}

async function transcribeWithWhisper(mp3Path: string): Promise<WhisperResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const { readFileSync } = await import('node:fs')
  const fileBuffer = readFileSync(mp3Path)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })

  const formData = new FormData()
  formData.append('file', blob, 'audio.mp3')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')
  formData.append('language', 'en')

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`    Whisper API error: ${res.status} ${text}`)
      return null
    }

    return await res.json() as WhisperResponse
  } catch (err) {
    console.error(`    Whisper API error: ${err}`)
    return null
  }
}

/**
 * Align Whisper segments to splitSentences() output.
 *
 * Whisper may split differently than our sentence splitter.
 * Strategy: use our splitter as the source of truth for sentence count and text,
 * then map timestamps from Whisper segments to our sentences by finding the
 * best matching Whisper segment for each sentence.
 */
function alignTimestamps(
  passageText: string,
  whisperSegments: WhisperSegment[],
  splitSentences: (text: string) => Array<{ index: number; text: string; start: number; end: number }>
): TimestampEntry[] {
  const sentences = splitSentences(passageText)

  if (sentences.length === 0 || whisperSegments.length === 0) {
    return []
  }

  // If Whisper produced exactly the same number of segments, map 1:1
  if (whisperSegments.length === sentences.length) {
    return sentences.map((s, i) => ({
      index: s.index,
      start: round(whisperSegments[i].start),
      end: round(whisperSegments[i].end),
      text: s.text,
    }))
  }

  // Otherwise, merge/split Whisper segments to match our sentence count.
  // Use a greedy approach: accumulate Whisper segments until we've covered
  // enough text to match the next sentence boundary.
  const result: TimestampEntry[] = []
  let whisperIdx = 0
  const whisperTexts = whisperSegments.map(s => s.text.trim())

  for (const sentence of sentences) {
    const sentenceNorm = normalize(sentence.text)
    let accumulated = ''
    const startIdx = whisperIdx
    let bestEnd = whisperIdx

    // Accumulate Whisper segments until we match this sentence
    while (whisperIdx < whisperSegments.length) {
      accumulated += (accumulated ? ' ' : '') + whisperTexts[whisperIdx]
      bestEnd = whisperIdx
      whisperIdx++

      const accNorm = normalize(accumulated)
      // Check if accumulated text covers this sentence
      if (accNorm.length >= sentenceNorm.length * 0.7) {
        break
      }
    }

    result.push({
      index: sentence.index,
      start: round(whisperSegments[startIdx]?.start ?? 0),
      end: round(whisperSegments[bestEnd]?.end ?? 0),
      text: sentence.text,
    })
  }

  return result
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const idIdx = args.indexOf('--id')
  const specificIds = idIdx !== -1
    ? args[idIdx + 1].split(',').map(Number)
    : null

  const splitSentences = await loadSplitter()
  const passages = await loadPassages()
  const outDir = resolve(PROJECT_ROOT, 'output/audio/passages')
  const tmpDir = resolve(PROJECT_ROOT, 'output/tmp')
  mkdirSync(outDir, { recursive: true })
  mkdirSync(tmpDir, { recursive: true })

  const toProcess = specificIds
    ? passages.filter(p => specificIds.includes(p.id))
    : passages

  console.log(`\n=== Generating timestamps for ${toProcess.length} passages ===\n`)

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const passage of toProcess) {
    const outPath = resolve(outDir, `passage-${passage.id}.timestamps.json`)

    if (!force && existsSync(outPath)) {
      skipped++
      continue
    }

    console.log(`  [${passage.id}] "${passage.title}"`)

    // Download MP3
    const tmpMp3 = resolve(tmpDir, `passage-${passage.id}.mp3`)
    console.log(`    Downloading MP3...`)
    const downloaded = await downloadMp3(passage.id, tmpMp3)
    if (!downloaded) {
      failed++
      continue
    }

    // Transcribe with Whisper
    console.log(`    Transcribing with Whisper...`)
    const whisperResult = await transcribeWithWhisper(tmpMp3)
    if (!whisperResult || !whisperResult.segments) {
      console.error(`    No segments returned`)
      failed++
      cleanup(tmpMp3)
      continue
    }

    console.log(`    Whisper returned ${whisperResult.segments.length} segments`)

    // Align to our sentence splitter
    const sentences = splitSentences(passage.text)
    console.log(`    Our splitter found ${sentences.length} sentences`)

    const timestamps = alignTimestamps(passage.text, whisperResult.segments, splitSentences)

    if (timestamps.length === 0) {
      console.error(`    Failed to align timestamps`)
      failed++
      cleanup(tmpMp3)
      continue
    }

    // Write output
    writeFileSync(outPath, JSON.stringify(timestamps, null, 2))
    console.log(`    ✓ Generated ${timestamps.length} timestamps → ${outPath}`)
    generated++

    // Cleanup temp MP3
    cleanup(tmpMp3)
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`)

  if (generated > 0) {
    console.log(`\nUpload to R2:`)
    console.log(`  rclone copy output/audio/passages/ r2:$R2_BUCKET/audio/passages/ --include "*.timestamps.json" --progress`)
  }
}

function cleanup(path: string) {
  try { unlinkSync(path) } catch { /* ignore */ }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
