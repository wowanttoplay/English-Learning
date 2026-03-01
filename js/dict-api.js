// Dictionary API Enhancement
// Fetches additional definitions and examples from Free Dictionary API
// Results cached in localStorage for offline access

const DictAPI = (() => {
  const CACHE_KEY = 'dict_cache';
  const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Dict cache save failed:', e);
    }
  }

  async function lookup(word) {
    const cache = getCache();
    if (cache[word]) {
      return cache[word];
    }

    try {
      const response = await fetch(API_BASE + encodeURIComponent(word));
      if (!response.ok) return null;

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const entry = data[0];
      const result = {
        word: entry.word,
        phonetics: [],
        meanings: []
      };

      // Extract phonetics
      if (entry.phonetics) {
        for (const p of entry.phonetics) {
          if (p.text) {
            result.phonetics.push({
              text: p.text,
              audio: p.audio || null
            });
          }
        }
      }

      // Extract meanings
      if (entry.meanings) {
        for (const m of entry.meanings) {
          const meaning = {
            partOfSpeech: m.partOfSpeech,
            definitions: []
          };
          if (m.definitions) {
            for (const d of m.definitions.slice(0, 3)) {
              meaning.definitions.push({
                definition: d.definition,
                example: d.example || null
              });
            }
          }
          result.meanings.push(meaning);
        }
      }

      // Cache the result
      cache[word] = result;
      saveCache(cache);

      return result;
    } catch (e) {
      console.warn('Dict API lookup failed for:', word, e);
      return null;
    }
  }

  function getCached(word) {
    const cache = getCache();
    return cache[word] || null;
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  return {
    lookup,
    getCached,
    clearCache
  };
})();
