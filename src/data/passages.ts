import type { Passage } from '@/types'
import { passages as batch1 } from './passages-002'
import { passages as batch2 } from './passages-003'
import { passages as batch3 } from './passages-004'

export const PASSAGES: Passage[] = [
  ...batch1,
  ...batch2,
  ...batch3,
]
