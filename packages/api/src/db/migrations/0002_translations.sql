CREATE TABLE IF NOT EXISTS word_translations (
  word_id     INTEGER NOT NULL,
  locale      TEXT NOT NULL,
  translation TEXT NOT NULL,
  PRIMARY KEY (word_id, locale),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS example_translations (
  word_id       INTEGER NOT NULL,
  locale        TEXT NOT NULL,
  example_index INTEGER NOT NULL,
  translation   TEXT NOT NULL,
  PRIMARY KEY (word_id, locale, example_index),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'en', definition_target FROM words
  WHERE definition_target IS NOT NULL AND definition_target != '';

INSERT INTO word_translations (word_id, locale, translation)
  SELECT id, 'zh-CN', definition_native FROM words
  WHERE definition_native IS NOT NULL AND definition_native != '';
