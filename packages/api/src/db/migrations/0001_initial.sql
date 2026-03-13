-- Supported languages
CREATE TABLE languages (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  native_name TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- All words across all languages
CREATE TABLE words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id TEXT NOT NULL,
  word        TEXT NOT NULL,
  pos         TEXT,
  phonetic    TEXT,
  definition_native TEXT,
  definition_target TEXT,
  examples    TEXT,
  level       TEXT NOT NULL,
  topics      TEXT,
  audio_url   TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_words_lang_level ON words(language_id, level);
CREATE INDEX idx_words_word ON words(language_id, word);

-- All passages across all languages
CREATE TABLE passages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  text        TEXT NOT NULL,
  level       TEXT NOT NULL,
  topic       TEXT NOT NULL,
  genre       TEXT,
  audio_url   TEXT,
  timestamps  TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_passages_lang_level ON passages(language_id, level);
CREATE INDEX idx_passages_topic ON passages(language_id, topic);

-- Which words appear in which passages
CREATE TABLE passage_words (
  passage_id  INTEGER NOT NULL,
  word_id     INTEGER NOT NULL,
  PRIMARY KEY (passage_id, word_id),
  FOREIGN KEY (passage_id) REFERENCES passages(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_passage_words_word ON passage_words(word_id);

-- Users (Clerk handles auth, we store internal ID)
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id    TEXT NOT NULL UNIQUE,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- SRS card state per user per word
CREATE TABLE srs_cards (
  user_id         INTEGER NOT NULL,
  word_id         INTEGER NOT NULL,
  state           TEXT NOT NULL,
  ease            INTEGER NOT NULL,
  interval        INTEGER NOT NULL,
  due             TEXT NOT NULL,
  due_timestamp   INTEGER NOT NULL,
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  step            INTEGER NOT NULL DEFAULT 0,
  previous_state  TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE RESTRICT
);

CREATE INDEX idx_srs_cards_due ON srs_cards(user_id, due);

-- Immutable review log
CREATE TABLE review_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  word_id     INTEGER NOT NULL,
  rating      INTEGER NOT NULL,
  state       TEXT NOT NULL,
  ease        INTEGER NOT NULL,
  interval    INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_review_log_user ON review_log(user_id, reviewed_at);

-- Daily learning statistics
CREATE TABLE srs_history (
  user_id     INTEGER NOT NULL,
  date        TEXT NOT NULL,
  reviewed    INTEGER NOT NULL DEFAULT 0,
  learned     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User-created custom words
CREATE TABLE user_words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  language_id TEXT NOT NULL,
  word        TEXT NOT NULL,
  pos         TEXT,
  phonetic    TEXT,
  definition_native TEXT,
  definition_target TEXT,
  examples    TEXT,
  topics      TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, language_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

CREATE INDEX idx_user_words_user ON user_words(user_id, language_id);

-- Passages the user has read
CREATE TABLE passages_read (
  user_id     INTEGER NOT NULL,
  passage_id  INTEGER NOT NULL,
  read_at     TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, passage_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (passage_id) REFERENCES passages(id) ON DELETE CASCADE
);

-- User settings
CREATE TABLE user_settings (
  user_id     INTEGER PRIMARY KEY,
  current_language TEXT DEFAULT 'en',
  settings    TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (current_language) REFERENCES languages(id)
);
