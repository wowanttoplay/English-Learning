// Word Index — O(1) lookup by ID + topic-based indexing
// Loaded after all word batch files and topics.js
const WORD_INDEX = (() => {
  const byId = new Map();
  const byTopic = {};

  // Build indices from WORD_LIST
  function build() {
    byId.clear();
    for (const key in byTopic) delete byTopic[key];

    for (const word of WORD_LIST) {
      byId.set(word.id, word);
      if (word.topics) {
        for (const t of word.topics) {
          if (!byTopic[t]) byTopic[t] = [];
          byTopic[t].push(word);
        }
      }
    }
  }

  // Build immediately on load
  build();

  return {
    get(id) {
      return byId.get(id) || null;
    },

    getByTopic(topicId) {
      return byTopic[topicId] || [];
    },

    getAllTopicCounts() {
      const counts = {};
      if (typeof TOPIC_REGISTRY !== 'undefined') {
        for (const topic of TOPIC_REGISTRY) {
          counts[topic.id] = (byTopic[topic.id] || []).length;
        }
      }
      return counts;
    },

    rebuild: build
  };
})();
