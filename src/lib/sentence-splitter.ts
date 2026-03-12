export interface Sentence {
  index: number
  text: string
  start: number
  end: number
}

const ABBREV = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|approx|dept|Fig|no|St|Ave|Blvd|vol|Ch|p)\s*$/i
const ABBREV_DOT = /\b(?:e\.g|i\.e|U\.S|U\.K)\s*$/i

function isDecimalDot(text: string, dotIndex: number): boolean {
  return dotIndex > 0 && dotIndex < text.length - 1
    && /\d/.test(text[dotIndex - 1]) && /\d/.test(text[dotIndex + 1])
}

function isEllipsis(text: string, dotIndex: number): boolean {
  if (text[dotIndex] !== '.') return false
  const before = dotIndex > 0 && text[dotIndex - 1] === '.'
  const after = dotIndex < text.length - 1 && text[dotIndex + 1] === '.'
  return before || after
}

function isAbbreviation(textBefore: string): boolean {
  return ABBREV.test(textBefore) || ABBREV_DOT.test(textBefore)
}

function isQuotedSpeechEnd(text: string, punctIndex: number): boolean {
  // Check if punctuation is inside quotes and followed by attribution like "she said"
  const after = text.slice(punctIndex + 1, punctIndex + 20).trimStart()
  if (/^['"'"]/.test(after)) {
    const rest = after.slice(1).trimStart()
    return /^(he|she|they|I|we|it|said|asked|replied|whispered|shouted|exclaimed)\b/i.test(rest)
  }
  return false
}

export function splitSentences(text: string): Sentence[] {
  if (!text || !text.trim()) return []

  const results: Sentence[] = []
  let sentenceStart = 0
  let i = 0

  // Skip leading whitespace
  while (i < text.length && /\s/.test(text[i])) {
    sentenceStart = i + 1
    i++
  }

  while (i < text.length) {
    const ch = text[i]

    if (ch === '.' || ch === '!' || ch === '?') {
      // Skip ellipsis
      if (isEllipsis(text, i)) {
        i++
        continue
      }

      // Skip decimal dots
      if (ch === '.' && isDecimalDot(text, i)) {
        i++
        continue
      }

      // Skip abbreviations
      if (ch === '.') {
        const before = text.slice(sentenceStart, i)
        if (isAbbreviation(before)) {
          i++
          continue
        }
      }

      // Skip quoted speech punctuation (e.g., "Hello!" she said.)
      if ((ch === '!' || ch === '?') && isQuotedSpeechEnd(text, i)) {
        i++
        continue
      }

      // Found a sentence boundary - consume trailing quotes and spaces
      let end = i + 1
      while (end < text.length && /['"'"\s]/.test(text[end])) {
        // Stop consuming spaces if we hit the start of the next sentence (uppercase letter)
        if (/\s/.test(text[end])) {
          let peek = end + 1
          while (peek < text.length && /\s/.test(text[peek])) peek++
          if (peek < text.length && /[A-Z"''""]/.test(text[peek])) {
            // Include trailing quotes but stop before next sentence
            end++
            break
          }
        }
        end++
      }

      const sentenceText = text.slice(sentenceStart, end).trim()
      if (sentenceText.length > 0) {
        // Calculate offsets of the trimmed text within original
        let trimStart = sentenceStart
        while (trimStart < end && /\s/.test(text[trimStart])) trimStart++
        let trimEnd = end
        while (trimEnd > trimStart && /\s/.test(text[trimEnd - 1])) trimEnd--

        results.push({
          index: results.length,
          text: sentenceText,
          start: trimStart,
          end: trimEnd,
        })
      }

      // Move past whitespace to start of next sentence
      i = end
      while (i < text.length && /\s/.test(text[i])) i++
      sentenceStart = i
    } else {
      i++
    }
  }

  // Handle remaining text (no terminal punctuation)
  if (sentenceStart < text.length) {
    const remaining = text.slice(sentenceStart).trim()
    if (remaining.length > 0) {
      let trimStart = sentenceStart
      while (trimStart < text.length && /\s/.test(text[trimStart])) trimStart++
      let trimEnd = text.length
      while (trimEnd > trimStart && /\s/.test(text[trimEnd - 1])) trimEnd--

      results.push({
        index: results.length,
        text: remaining,
        start: trimStart,
        end: trimEnd,
      })
    }
  }

  return results
}
