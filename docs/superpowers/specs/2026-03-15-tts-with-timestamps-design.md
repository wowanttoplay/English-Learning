# Unified TTS + Timestamps Generation

## Goal

Eliminate the separate Whisper-based timestamp generation step. Google TTS produces both MP3 and sentence timing in a single call via SSML `<mark>` tags.

## Changes

### 1. Modify `generate-tts.ts` — passages section

- Use `splitSentences()` to split passage text into sentences
- Build SSML with `<mark name="s0"/>` before each sentence
- Call `synthesizeSpeech` with `{ input: { ssml } }` instead of `{ input: { text } }`
- Extract `timepoints` from the response — each gives `{ markName, timeSeconds }`
- Compute start/end for each sentence from consecutive timepoint pairs
- Write `passage-{id}.timestamps.json` alongside the MP3

### 2. Delete `generate-timestamps.ts`

No longer needed — timestamps come from TTS directly.

### 3. Clean up references

- Remove `generate-timestamps` script from `packages/web/package.json`
- Update CLAUDE.md to remove references to `generate-timestamps` and Whisper

## Output format (unchanged)

```json
[
  { "index": 0, "start": 0.0, "end": 3.2, "text": "First sentence." },
  { "index": 1, "start": 3.2, "end": 6.8, "text": "Second sentence." }
]
```

## Non-Goals

- Changing word or example audio generation (stays as-is)
- Changing the timestamp JSON format
