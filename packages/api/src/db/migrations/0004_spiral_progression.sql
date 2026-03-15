-- Add sequence for ordered curriculum within a level
-- Nullable to allow supplemental passages outside the curriculum
ALTER TABLE passages ADD COLUMN sequence INTEGER;

-- Unique constraint per (language, level) — partial index allows NULL sequence
CREATE UNIQUE INDEX idx_passages_sequence
  ON passages(language_id, level, sequence)
  WHERE sequence IS NOT NULL;

-- Add role to passage-word relationships
-- 'new'    = word introduced for the first time in this passage
-- 'review' = word revisited from an earlier passage
ALTER TABLE passage_words ADD COLUMN role TEXT NOT NULL DEFAULT 'new'
  CHECK (role IN ('new', 'review'));
