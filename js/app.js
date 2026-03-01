// Main Application Logic
const App = (() => {
  let currentScreen = 'dashboard';
  let sessionQueue = [];
  let sessionIndex = 0;
  let sessionRevealed = false;
  let sessionType = ''; // 'learn' or 'review' or 'mixed'
  let sessionCompleteStats = null;
  let wordListFilter = 'all';
  let wordListSearch = '';
  let wordListPage = 0;
  const WORDS_PER_PAGE = 50;
  let modalWordId = null;

  // --- Theme ---
  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    render();
  }

  // --- Audio ---
  function speak(word) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }

  // --- Navigation ---
  function navigate(screen) {
    currentScreen = screen;
    render();
  }

  // --- Word lookup helper ---
  function getWord(id) {
    return WORD_LIST.find(w => w.id === id);
  }

  // --- Start session ---
  function startSession(type) {
    const cards = SRS.getCardsForToday();
    sessionQueue = [];
    sessionIndex = 0;
    sessionRevealed = false;
    sessionType = type;
    sessionCompleteStats = null;

    if (type === 'review') {
      sessionQueue = [...cards.learning, ...cards.review];
    } else if (type === 'learn') {
      sessionQueue = [...cards.new];
    } else {
      // Mixed: learning cards first, then review, then new
      sessionQueue = [...cards.learning, ...cards.review, ...cards.new];
    }

    if (sessionQueue.length === 0) {
      return;
    }

    navigate('card');
  }

  function getCurrentCard() {
    if (sessionIndex >= sessionQueue.length) return null;
    return sessionQueue[sessionIndex];
  }

  function revealCard() {
    sessionRevealed = true;
    render();
    // Pre-fetch dictionary data for current word
    const card = getCurrentCard();
    if (card) {
      const word = getWord(card.wordId);
      if (word && !DictAPI.getCached(word.word)) {
        DictAPI.lookup(word.word).then(() => {
          if (sessionRevealed) render(); // re-render if still on same card
        });
      }
    }
  }

  function rateCurrentCard(rating) {
    const card = getCurrentCard();
    if (!card) return;

    const result = SRS.rateCard(card.wordId, rating);

    // If card is still in learning/relearning steps, re-add to end of queue
    if (result.state === 'learning' || result.state === 'relearning') {
      sessionQueue.push(result);
    }

    sessionIndex++;
    sessionRevealed = false;

    if (sessionIndex >= sessionQueue.length) {
      // Session complete
      const stats = SRS.getStats();
      sessionCompleteStats = {
        reviewed: sessionIndex,
        type: sessionType
      };
      navigate('complete');
    } else {
      render();
    }
  }

  // --- Render functions ---

  function render() {
    const app = document.getElementById('app');
    let html = '';

    switch (currentScreen) {
      case 'dashboard':
        html = renderDashboard();
        break;
      case 'card':
        html = renderCard();
        break;
      case 'complete':
        html = renderComplete();
        break;
      case 'wordlist':
        html = renderWordList();
        break;
      case 'settings':
        html = renderSettings();
        break;
    }

    // Add bottom nav unless in card mode
    if (currentScreen !== 'card') {
      html += renderBottomNav();
    }

    // Add modal if open
    if (modalWordId !== null) {
      html += renderModal(modalWordId);
    }

    app.innerHTML = html;
    bindEvents();
  }

  function renderDashboard() {
    const stats = SRS.getStats();
    const due = SRS.getDueCount();
    const progressPct = stats.totalWords > 0
      ? Math.round((stats.totalStarted / stats.totalWords) * 100)
      : 0;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    return `
      <div class="fade-in">
        <div class="header">
          <h1>Oxford 5000</h1>
          <div class="header-actions">
            <button class="icon-btn" onclick="App.toggleTheme()" title="Toggle theme">
              ${isDark ? '&#9728;' : '&#9790;'}
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value blue">${due.new}</div>
            <div class="stat-label">New</div>
          </div>
          <div class="stat-card">
            <div class="stat-value orange">${due.review + due.learning}</div>
            <div class="stat-label">To Review</div>
          </div>
          <div class="stat-card">
            <div class="stat-value green">${stats.streak}</div>
            <div class="stat-label">Day Streak</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>Progress</span>
            <span>${stats.totalStarted} / ${stats.totalWords} words</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalLearning}</div>
            <div class="stat-label">Learning</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalReview}</div>
            <div class="stat-label">Young</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalMastered}</div>
            <div class="stat-label">Mastered</div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" ${due.total === 0 ? 'disabled' : ''}
                  onclick="App.startSession('mixed')">
            Start Study
            <span class="btn-count">${due.total}</span>
          </button>
          ${due.review + due.learning > 0 ? `
            <button class="btn btn-secondary" onclick="App.startSession('review')">
              Review Due
              <span class="btn-count">${due.review + due.learning}</span>
            </button>
          ` : ''}
          ${due.new > 0 ? `
            <button class="btn btn-secondary" onclick="App.startSession('learn')">
              Learn New Words
              <span class="btn-count">${due.new}</span>
            </button>
          ` : ''}
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="stat-card">
            <div class="stat-value">${stats.todayLearned}</div>
            <div class="stat-label">Learned Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.todayReviewed}</div>
            <div class="stat-label">Reviewed Today</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCard() {
    const card = getCurrentCard();
    if (!card) return renderDashboard();

    const word = getWord(card.wordId);
    if (!word) return renderDashboard();

    const total = sessionQueue.length;
    const progressPct = total > 0 ? Math.round((sessionIndex / total) * 100) : 0;

    const stateLabel = card.state === 'new' ? 'New' :
                       card.state === 'learning' ? 'Learning' :
                       card.state === 'relearning' ? 'Relearning' : 'Review';

    let html = `
      <div class="card-screen fade-in">
        <div class="card-header">
          <button class="back-btn" onclick="App.navigate('dashboard')">&#8592; Back</button>
          <span class="card-progress">${sessionIndex + 1} / ${total} &middot; ${stateLabel}</span>
        </div>
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${progressPct}%"></div>
        </div>

        <div class="flashcard" ${!sessionRevealed ? 'onclick="App.revealCard()"' : ''}>
          <div class="card-front">
            <div class="card-word">${word.word}</div>
            <div class="card-phonetic">${word.phonetic}</div>
            <div class="card-pos">${word.pos}</div>
            <button class="audio-btn" onclick="event.stopPropagation(); App.speak('${word.word}')">
              &#9654;
            </button>
            ${!sessionRevealed ? '<div class="tap-hint">Tap to reveal answer</div>' : ''}
          </div>
    `;

    if (sessionRevealed) {
      const dictData = DictAPI.getCached(word.word);

      html += `
          <div class="card-back">
            <div class="card-zh">${word.zh}</div>
            <div class="card-en">${word.en}</div>
            <ul class="card-examples">
              ${word.examples.map(ex => `<li>${ex}</li>`).join('')}
            </ul>
      `;

      // Show extra dictionary data if available
      if (dictData && dictData.meanings) {
        const extraDefs = [];
        for (const m of dictData.meanings) {
          for (const d of m.definitions) {
            if (d.definition !== word.en && extraDefs.length < 2) {
              extraDefs.push({ pos: m.partOfSpeech, def: d.definition, example: d.example });
            }
          }
        }
        if (extraDefs.length > 0) {
          html += `<div class="card-extra">
            <div class="card-extra-title">More definitions</div>
            ${extraDefs.map(d => `
              <div class="card-extra-def"><i>${d.pos}</i> &mdash; ${d.def}</div>
              ${d.example ? `<div class="card-extra-example">"${d.example}"</div>` : ''}
            `).join('')}
          </div>`;
        }
      }

      html += `</div>`; // close card-back
    }

    html += `</div>`; // close flashcard

    if (sessionRevealed) {
      html += renderRatingButtons(card);
    }

    html += `</div>`; // close card-screen
    return html;
  }

  function renderRatingButtons(card) {
    const intervals = getNextIntervals(card);
    return `
      <div class="rating-buttons">
        <button class="rate-btn again" onclick="App.rateCurrentCard(1)">
          Again
          <span class="rate-interval">${intervals.again}</span>
        </button>
        <button class="rate-btn hard" onclick="App.rateCurrentCard(2)">
          Hard
          <span class="rate-interval">${intervals.hard}</span>
        </button>
        <button class="rate-btn good" onclick="App.rateCurrentCard(3)">
          Good
          <span class="rate-interval">${intervals.good}</span>
        </button>
        <button class="rate-btn easy" onclick="App.rateCurrentCard(4)">
          Easy
          <span class="rate-interval">${intervals.easy}</span>
        </button>
      </div>
    `;
  }

  function getNextIntervals(card) {
    if (card.state === 'new' || card.state === 'learning' || card.state === 'relearning') {
      const step = card.step || 0;
      return {
        again: '1m',
        hard: step < 2 ? ['1m', '10m'][step] : '10m',
        good: step + 1 >= 2 ? '1d' : '10m',
        easy: '4d'
      };
    }

    // Review card
    const ease = card.ease || 2.5;
    const interval = card.interval || 1;
    return {
      again: '1d',
      hard: formatInterval(Math.max(1, Math.round(interval * 1.2))),
      good: formatInterval(Math.max(1, Math.round(interval * ease))),
      easy: formatInterval(Math.max(1, Math.round(interval * ease * 1.3)))
    };
  }

  function formatInterval(days) {
    if (days < 1) return '<1d';
    if (days === 1) return '1d';
    if (days < 30) return days + 'd';
    if (days < 365) return Math.round(days / 30) + 'mo';
    return (days / 365).toFixed(1) + 'y';
  }

  function renderComplete() {
    const stats = SRS.getStats();
    return `
      <div class="fade-in">
        <div class="header">
          <h1>Oxford 5000</h1>
        </div>
        <div class="session-complete">
          <div class="session-complete-icon">&#127881;</div>
          <h2>Session Complete!</h2>
          <p>Great work! You reviewed ${sessionCompleteStats ? sessionCompleteStats.reviewed : 0} cards.</p>

          <div class="session-stats">
            <div class="stat-card">
              <div class="stat-value green">${stats.todayLearned}</div>
              <div class="stat-label">New Today</div>
            </div>
            <div class="stat-card">
              <div class="stat-value blue">${stats.todayReviewed}</div>
              <div class="stat-label">Reviewed Today</div>
            </div>
            <div class="stat-card">
              <div class="stat-value orange">${stats.streak}</div>
              <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalStarted}</div>
              <div class="stat-label">Total Started</div>
            </div>
          </div>

          <div class="action-buttons">
            ${SRS.getDueCount().total > 0 ? `
              <button class="btn btn-primary" onclick="App.startSession('mixed')">
                Continue Studying
                <span class="btn-count">${SRS.getDueCount().total}</span>
              </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="App.navigate('dashboard')">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderWordList() {
    const states = SRS.getAllCardStates();
    const search = wordListSearch.toLowerCase().trim();

    let filtered = WORD_LIST.filter(w => {
      // Filter by search
      if (search && !w.word.toLowerCase().includes(search) && !w.zh.includes(search)) {
        return false;
      }
      // Filter by state
      const state = states[w.id] || 'unseen';
      if (wordListFilter === 'all') return true;
      if (wordListFilter === 'unseen') return state === 'unseen';
      if (wordListFilter === 'learning') return state === 'learning' || state === 'relearning' || state === 'new';
      if (wordListFilter === 'review') return state === 'review';
      if (wordListFilter === 'mastered') return state === 'mastered';
      return true;
    });

    const visibleCount = (wordListPage + 1) * WORDS_PER_PAGE;
    const visibleWords = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    const filterCounts = { all: 0, unseen: 0, learning: 0, review: 0, mastered: 0 };
    WORD_LIST.forEach(w => {
      const s = states[w.id] || 'unseen';
      filterCounts.all++;
      if (s === 'unseen') filterCounts.unseen++;
      else if (s === 'learning' || s === 'relearning' || s === 'new') filterCounts.learning++;
      else if (s === 'review') filterCounts.review++;
      else if (s === 'mastered') filterCounts.mastered++;
    });

    return `
      <div class="fade-in">
        <div class="wordlist-header">
          <h2>Word List</h2>
        </div>

        <input class="search-box" type="text" placeholder="Search words..."
               value="${wordListSearch}" oninput="App.onSearchInput(this.value)">

        <div class="filter-tabs">
          ${['all', 'unseen', 'learning', 'review', 'mastered'].map(f => `
            <button class="filter-tab ${wordListFilter === f ? 'active' : ''}"
                    onclick="App.setFilter('${f}')">
              ${f.charAt(0).toUpperCase() + f.slice(1)} (${filterCounts[f]})
            </button>
          `).join('')}
        </div>

        <div class="word-list">
          ${visibleWords.length === 0 ? '<div class="word-list-empty">No words found</div>' : ''}
          ${visibleWords.map(w => {
            const state = states[w.id] || 'unseen';
            return `
              <div class="word-item" onclick="App.showWordDetail(${w.id})">
                <div class="word-item-text">
                  <div class="word-item-word">${w.word}</div>
                  <div class="word-item-zh">${w.zh}</div>
                </div>
                <span class="word-item-badge badge-${state}">${state}</span>
              </div>
            `;
          }).join('')}
          ${hasMore ? `
            <button class="load-more-btn" onclick="App.loadMoreWords()">
              Load more (${filtered.length - visibleCount} remaining)
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderSettings() {
    const stats = SRS.getStats();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    return `
      <div class="fade-in">
        <div class="header">
          <h1>Settings</h1>
        </div>

        <div class="settings-section">
          <div class="settings-item">
            <span class="settings-label">New cards per day</span>
            <div class="settings-value">
              <input class="settings-input" type="number" min="1" max="100"
                     value="${stats.newCardsPerDay}"
                     onchange="App.setNewCardsPerDay(this.value)">
            </div>
          </div>
          <div class="settings-item">
            <span class="settings-label">Theme</span>
            <div class="settings-value">
              <button class="filter-tab ${!isDark ? 'active' : ''}" onclick="App.setTheme('light')">Light</button>
              <button class="filter-tab ${isDark ? 'active' : ''}" onclick="App.setTheme('dark')">Dark</button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-item">
            <span class="settings-label">Total words in list</span>
            <span>${stats.totalWords}</span>
          </div>
          <div class="settings-item">
            <span class="settings-label">Words started</span>
            <span>${stats.totalStarted}</span>
          </div>
          <div class="settings-item">
            <span class="settings-label">Mastered (21+ day interval)</span>
            <span>${stats.totalMastered}</span>
          </div>
        </div>

        <div class="action-buttons" style="margin-top: 24px;">
          <button class="btn btn-danger" onclick="App.confirmReset()">
            Reset All Progress
          </button>
        </div>
      </div>
    `;
  }

  function renderModal(wordId) {
    const word = getWord(wordId);
    if (!word) return '';
    const state = SRS.getCardState(wordId);
    const card = SRS.getCard(wordId);
    const dictData = DictAPI.getCached(word.word);

    // Fetch dict data if not cached
    if (!dictData) {
      DictAPI.lookup(word.word).then(() => render());
    }

    return `
      <div class="modal-overlay" onclick="App.closeModal()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>

          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <div style="flex:1">
              <div class="card-word" style="font-size:28px">${word.word}</div>
              <div class="card-phonetic">${word.phonetic}</div>
              <div class="card-pos">${word.pos}</div>
            </div>
            <button class="audio-btn" onclick="App.speak('${word.word}')">&#9654;</button>
            <span class="word-item-badge badge-${state}">${state}</span>
          </div>

          <div class="card-zh" style="font-size:20px">${word.zh}</div>
          <div class="card-en" style="margin-top:8px">${word.en}</div>

          <ul class="card-examples" style="margin-top:12px">
            ${word.examples.map(ex => `<li>${ex}</li>`).join('')}
          </ul>

          ${card ? `
            <div style="margin-top:16px; padding-top:12px; border-top: 1px solid var(--border); font-size:13px; color:var(--text-secondary)">
              Ease: ${card.ease.toFixed(2)} &middot; Interval: ${card.interval}d &middot; Reps: ${card.reps}
              ${card.due ? ` &middot; Due: ${card.due}` : ''}
            </div>
          ` : ''}

          ${dictData && dictData.meanings ? `
            <div class="card-extra" style="margin-top:16px">
              <div class="card-extra-title">Dictionary</div>
              ${dictData.meanings.map(m => `
                <div style="margin-bottom:8px">
                  <i>${m.partOfSpeech}</i>
                  ${m.definitions.map(d => `
                    <div class="card-extra-def">&bull; ${d.definition}</div>
                    ${d.example ? `<div class="card-extra-example">"${d.example}"</div>` : ''}
                  `).join('')}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderBottomNav() {
    return `
      <nav class="bottom-nav">
        <div class="bottom-nav-inner">
          <button class="nav-item ${currentScreen === 'dashboard' || currentScreen === 'complete' ? 'active' : ''}"
                  onclick="App.navigate('dashboard')">
            <span class="nav-icon">&#127968;</span>
            Home
          </button>
          <button class="nav-item ${currentScreen === 'wordlist' ? 'active' : ''}"
                  onclick="App.navigate('wordlist')">
            <span class="nav-icon">&#128218;</span>
            Words
          </button>
          <button class="nav-item ${currentScreen === 'settings' ? 'active' : ''}"
                  onclick="App.navigate('settings')">
            <span class="nav-icon">&#9881;</span>
            Settings
          </button>
        </div>
      </nav>
    `;
  }

  // --- Event handlers ---

  function bindEvents() {
    // Keyboard shortcuts for card screen
    // Handled via global keydown listener
  }

  function onSearchInput(value) {
    wordListSearch = value;
    wordListPage = 0;
    render();
    // Re-focus search input and restore cursor
    const input = document.querySelector('.search-box');
    if (input) {
      input.focus();
      input.setSelectionRange(value.length, value.length);
    }
  }

  function setFilter(filter) {
    wordListFilter = filter;
    wordListPage = 0;
    render();
  }

  function loadMoreWords() {
    wordListPage++;
    render();
  }

  function showWordDetail(wordId) {
    modalWordId = wordId;
    render();
  }

  function closeModal() {
    modalWordId = null;
    render();
  }

  function setNewCardsPerDay(value) {
    const n = parseInt(value);
    if (n > 0 && n <= 100) {
      SRS.setNewCardsPerDay(n);
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    render();
  }

  function confirmReset() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      SRS.resetProgress();
      SRS.clearCache();
      DictAPI.clearCache();
      navigate('dashboard');
    }
  }

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (currentScreen !== 'card') return;

    if (!sessionRevealed) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        revealCard();
      }
    } else {
      switch (e.key) {
        case '1': rateCurrentCard(1); break;
        case '2': rateCurrentCard(2); break;
        case '3': rateCurrentCard(3); break;
        case '4': rateCurrentCard(4); break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          rateCurrentCard(3); // Good
          break;
      }
    }
  });

  // --- Init ---
  function init() {
    initTheme();
    render();
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    navigate,
    startSession,
    revealCard,
    rateCurrentCard,
    speak,
    toggleTheme,
    setTheme,
    onSearchInput,
    setFilter,
    loadMoreWords,
    showWordDetail,
    closeModal,
    setNewCardsPerDay,
    confirmReset
  };
})();
