// SM-2 Spaced Repetition Engine
// Card states: new → learning → review (→ relearning on fail)
// Ratings: Again(1), Hard(2), Good(3), Easy(4)

const SRS = (() => {
  const STORAGE_KEY = 'srs_data';
  const LEARNING_STEPS = [1, 10]; // minutes
  const GRADUATING_INTERVAL = 1; // days
  const EASY_INTERVAL = 4; // days
  const DEFAULT_EASE = 2.5;
  const MIN_EASE = 1.3;
  const NEW_CARDS_PER_DAY = 20;

  // --- Persistence ---

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse SRS data', e);
      }
    }
    return {
      cards: {},
      settings: { newCardsPerDay: NEW_CARDS_PER_DAY, currentPosition: 0, activeTopics: [] },
      history: {}
    };
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getData() {
    if (!SRS._cache) {
      SRS._cache = loadData();
    }
    return SRS._cache;
  }

  function persist() {
    saveData(getData());
  }

  // --- Date helpers ---

  function formatDate(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function today() {
    return formatDate(new Date());
  }

  function now() {
    return Date.now();
  }

  function addMinutes(date, mins) {
    return new Date(date.getTime() + mins * 60 * 1000);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00'); // noon to avoid DST edge cases
    d.setDate(d.getDate() + days);
    return formatDate(d);
  }

  function isDue(card) {
    if (card.state === 'learning' || card.state === 'relearning') {
      return now() >= card.dueTimestamp;
    }
    return card.due <= today();
  }

  // --- Card management ---

  function getCard(wordId) {
    const data = getData();
    return data.cards[wordId] || null;
  }

  function initCard(wordId) {
    return {
      wordId: wordId,
      state: 'new',
      ease: DEFAULT_EASE,
      interval: 0,
      due: today(),
      dueTimestamp: now(),
      reps: 0,
      lapses: 0,
      step: 0
    };
  }

  // --- SM-2 Rating Logic ---

  function rateCard(wordId, rating) {
    const data = getData();

    if (!data.cards[wordId]) {
      data.cards[wordId] = initCard(wordId);
    }

    const card = data.cards[wordId];
    const prevState = card.state;

    switch (card.state) {
      case 'new':
      case 'learning':
      case 'relearning':
        rateLearningCard(card, rating);
        break;
      case 'review':
        rateReviewCard(card, rating);
        break;
    }

    card.reps++;

    // Track history
    const todayStr = today();
    if (!data.history[todayStr]) {
      data.history[todayStr] = { reviewed: 0, learned: 0 };
    }
    data.history[todayStr].reviewed++;
    if (prevState === 'new') {
      data.history[todayStr].learned++;
    }

    persist();
    return card;
  }

  function rateLearningCard(card, rating) {
    // Transition from 'new' to 'learning' on first rating
    if (card.state === 'new') {
      card.state = 'learning';
    }

    if (rating === 1) {
      // Again: reset to first step
      card.step = 0;
      card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[0]).getTime();
      card.due = today();
    } else if (rating === 2) {
      // Hard: repeat current step
      const stepMinutes = LEARNING_STEPS[card.step] || LEARNING_STEPS[LEARNING_STEPS.length - 1];
      card.dueTimestamp = addMinutes(new Date(), stepMinutes).getTime();
      card.due = today();
    } else if (rating === 3) {
      // Good: advance to next step or graduate
      card.step++;
      if (card.step >= LEARNING_STEPS.length) {
        // Graduate to review
        graduateCard(card, GRADUATING_INTERVAL);
      } else {
        card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[card.step]).getTime();
        card.due = today();
      }
    } else if (rating === 4) {
      // Easy: graduate immediately with bonus interval
      graduateCard(card, EASY_INTERVAL);
      card.ease += 0.15;
    }
  }

  function graduateCard(card, interval) {
    card.state = 'review';
    card.interval = interval;
    card.due = addDays(today(), interval);
    card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime();
    card.step = 0;
  }

  function rateReviewCard(card, rating) {
    if (rating === 1) {
      // Again: lapse → relearning
      card.lapses++;
      card.state = 'relearning';
      card.step = 0;
      card.interval = Math.max(1, Math.round(card.interval * 0.5));
      card.ease = Math.max(MIN_EASE, card.ease - 0.20);
      card.dueTimestamp = addMinutes(new Date(), LEARNING_STEPS[0]).getTime();
      card.due = today();
    } else if (rating === 2) {
      // Hard
      card.interval = Math.max(1, Math.round(card.interval * 1.2));
      card.ease = Math.max(MIN_EASE, card.ease - 0.15);
      card.due = addDays(today(), card.interval);
      card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime();
    } else if (rating === 3) {
      // Good
      card.interval = Math.max(1, Math.round(card.interval * card.ease));
      card.due = addDays(today(), card.interval);
      card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime();
    } else if (rating === 4) {
      // Easy
      card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
      card.ease += 0.15;
      card.due = addDays(today(), card.interval);
      card.dueTimestamp = new Date(card.due + 'T00:00:00').getTime();
    }
  }

  // --- Queue management ---

  function getCardsForToday() {
    const data = getData();
    const todayStr = today();

    // Count new cards learned today
    const learnedToday = (data.history[todayStr] || {}).learned || 0;
    const newCardsRemaining = Math.max(0, data.settings.newCardsPerDay - learnedToday);

    const reviewCards = [];
    const learningCards = [];

    // Collect due review and learning cards
    for (const id in data.cards) {
      const card = data.cards[id];
      if (card.state === 'review' && isDue(card)) {
        reviewCards.push(card);
      } else if ((card.state === 'learning' || card.state === 'relearning') && isDue(card)) {
        learningCards.push(card);
      }
    }

    // Collect new cards (filtered by activeTopics if set)
    const newCards = [];
    if (newCardsRemaining > 0 && typeof WORD_LIST !== 'undefined') {
      const active = data.settings.activeTopics || [];
      const filterByTopic = active.length > 0;
      const activeSet = filterByTopic ? new Set(active) : null;

      let count = 0;
      for (let i = 0; i < WORD_LIST.length && count < newCardsRemaining; i++) {
        const word = WORD_LIST[i];
        if (data.cards[word.id]) continue;
        // If topic filter is active, skip words that don't match any active topic
        if (filterByTopic) {
          const topics = word.topics || [];
          if (!topics.some(t => activeSet.has(t))) continue;
        }
        newCards.push({
          wordId: word.id,
          state: 'new',
          ease: DEFAULT_EASE,
          interval: 0,
          due: todayStr,
          dueTimestamp: now(),
          reps: 0,
          lapses: 0,
          step: 0
        });
        count++;
      }
    }

    // Sort: learning cards first (most urgent), then review, then new
    learningCards.sort((a, b) => a.dueTimestamp - b.dueTimestamp);
    reviewCards.sort((a, b) => (a.due > b.due ? 1 : -1));

    return {
      learning: learningCards,
      review: reviewCards,
      new: newCards,
      total: learningCards.length + reviewCards.length + newCards.length
    };
  }

  function getDueCount() {
    const cards = getCardsForToday();
    return {
      learning: cards.learning.length,
      review: cards.review.length,
      new: cards.new.length,
      total: cards.total
    };
  }

  // --- Statistics ---

  function getStats() {
    const data = getData();
    const todayStr = today();
    const todayHistory = data.history[todayStr] || { reviewed: 0, learned: 0 };

    let totalNew = 0;
    let totalLearning = 0;
    let totalReview = 0;
    let totalMastered = 0; // interval >= 21 days

    for (const id in data.cards) {
      const card = data.cards[id];
      switch (card.state) {
        case 'new': totalNew++; break;
        case 'learning':
        case 'relearning': totalLearning++; break;
        case 'review':
          if (card.interval >= 21) {
            totalMastered++;
          } else {
            totalReview++;
          }
          break;
      }
    }

    const totalWords = typeof WORD_LIST !== 'undefined' ? WORD_LIST.length : 0;
    const totalStarted = Object.keys(data.cards).length;
    const unseenWords = totalWords - totalStarted;

    // Calculate streak
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = formatDate(d);
      if (data.history[dateStr] && data.history[dateStr].reviewed > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      todayReviewed: todayHistory.reviewed,
      todayLearned: todayHistory.learned,
      totalWords,
      totalStarted,
      unseenWords,
      totalLearning,
      totalReview,
      totalMastered,
      streak,
      newCardsPerDay: data.settings.newCardsPerDay
    };
  }

  function getCardState(wordId) {
    const card = getCard(wordId);
    if (!card) return 'unseen';
    if (card.state === 'review' && card.interval >= 21) return 'mastered';
    return card.state;
  }

  function getAllCardStates() {
    const data = getData();
    const states = {};
    for (const id in data.cards) {
      const card = data.cards[id];
      if (card.state === 'review' && card.interval >= 21) {
        states[id] = 'mastered';
      } else {
        states[id] = card.state;
      }
    }
    return states;
  }

  // --- Settings ---

  function setNewCardsPerDay(count) {
    const data = getData();
    data.settings.newCardsPerDay = count;
    persist();
  }

  function setActiveTopics(topicIds) {
    const data = getData();
    data.settings.activeTopics = topicIds || [];
    persist();
  }

  function getActiveTopics() {
    const data = getData();
    return data.settings.activeTopics || [];
  }

  function resetProgress() {
    SRS._cache = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  function clearCache() {
    SRS._cache = null;
  }

  return {
    _cache: null,
    rateCard,
    getCardsForToday,
    getDueCount,
    getStats,
    getCardState,
    getAllCardStates,
    setNewCardsPerDay,
    setActiveTopics,
    getActiveTopics,
    resetProgress,
    clearCache,
    getCard,
    today,
    loadData,
    persist
  };
})();
