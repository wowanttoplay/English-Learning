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
  let wordListTopic = 'all';
  let wordListPage = 0;
  const WORDS_PER_PAGE = 50;
  let modalWordId = null;

  // --- Reading state ---
  let readingPassageId = null; // currently reading passage
  let readingTooltipWordId = null; // tooltip for highlighted word

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
  function speak(word, speed) {
    if (typeof AudioPlayer !== 'undefined') {
      AudioPlayer.playWord(word, speed || 'normal');
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }

  function speakSlow(word) {
    speak(word, 'slow');
  }

  function speakSentence(text, speed) {
    if (typeof AudioPlayer !== 'undefined') {
      AudioPlayer.playSentence(text, speed || 'normal');
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  }

  function autoPlayWord(word) {
    if (typeof AudioPlayer !== 'undefined' && AudioPlayer.getAutoPlay()) {
      AudioPlayer.playWord(word, 'normal');
    }
  }

  // --- Navigation ---
  function navigate(screen) {
    currentScreen = screen;
    render();
  }

  // --- Word lookup helper ---
  function getWord(id) {
    if (typeof WORD_INDEX !== 'undefined') return WORD_INDEX.get(id);
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

    // Auto-play the first card's word and preload upcoming words
    setTimeout(() => {
      const card = getCurrentCard();
      if (card) {
        const word = getWord(card.wordId);
        if (word) {
          autoPlayWord(word.word);
          preloadUpcoming();
        }
      }
    }, 300);
  }

  function preloadUpcoming() {
    if (typeof AudioPlayer === 'undefined') return;
    // Preload next 3 words in queue
    for (let i = sessionIndex + 1; i < Math.min(sessionIndex + 4, sessionQueue.length); i++) {
      const card = sessionQueue[i];
      if (card) {
        const word = getWord(card.wordId);
        if (word) AudioPlayer.preload(word.word);
      }
    }
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
      sessionCompleteStats = {
        reviewed: sessionIndex,
        type: sessionType
      };
      navigate('complete');
    } else {
      render();
      // Auto-play next card's word
      const nextCard = getCurrentCard();
      if (nextCard) {
        const word = getWord(nextCard.wordId);
        if (word) {
          setTimeout(() => autoPlayWord(word.word), 200);
          preloadUpcoming();
        }
      }
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
      case 'topics':
        html = renderTopics();
        break;
      case 'reading':
        html = renderReading();
        break;
      case 'passage':
        html = renderPassage();
        break;
    }

    // Add bottom nav unless in card or passage mode
    if (currentScreen !== 'card' && currentScreen !== 'passage') {
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
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Calculate multi-segment progress
    const totalWords = stats.totalWords || 1;
    const unseenCount = totalWords - stats.totalStarted;
    const learningCount = stats.totalLearning || 0;
    const youngCount = stats.totalReview || 0;
    const masteredCount = stats.totalMastered || 0;

    const unseenPct = Math.round((unseenCount / totalWords) * 100);
    const learningPct = Math.round((learningCount / totalWords) * 100);
    const youngPct = Math.round((youngCount / totalWords) * 100);
    const masteredPct = Math.round((masteredCount / totalWords) * 100);

    // Weekly heatmap data
    const heatmapHtml = renderWeeklyHeatmap();

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
          <div class="progress-bar-multi">
            <div class="progress-segment mastered" style="width: ${masteredPct}%" title="Mastered: ${masteredCount}"></div>
            <div class="progress-segment young" style="width: ${youngPct}%" title="Young: ${youngCount}"></div>
            <div class="progress-segment learning" style="width: ${learningPct}%" title="Learning: ${learningCount}"></div>
          </div>
          <div class="progress-legend">
            <span class="legend-item"><span class="legend-dot mastered"></span>${masteredCount} Mastered</span>
            <span class="legend-item"><span class="legend-dot young"></span>${youngCount} Young</span>
            <span class="legend-item"><span class="legend-dot learning"></span>${learningCount} Learning</span>
            <span class="legend-item"><span class="legend-dot unseen"></span>${unseenCount} Unseen</span>
          </div>
        </div>

        ${renderTopicSummary()}

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

        ${heatmapHtml}

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

  function getSrsHistory() {
    try {
      const raw = localStorage.getItem('srs_data');
      if (raw) {
        const data = JSON.parse(raw);
        return data.history || {};
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  function renderWeeklyHeatmap() {
    const history = getSrsHistory();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    // Adjust so Monday=0
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const days = [];
    let maxCount = 1;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (mondayOffset - i));
      const key = formatDateKey(d);
      const entry = history[key];
      const count = entry ? (entry.reviewed || 0) : 0;
      if (count > maxCount) maxCount = count;
      days.push({ name: dayNames[i], count, isToday: i === mondayOffset });
    }

    return `
      <div class="heatmap-section">
        <div class="heatmap-title">This Week</div>
        <div class="heatmap-grid">
          ${days.map(d => {
            const level = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / maxCount) * 4));
            return `
              <div class="heatmap-day ${d.isToday ? 'today' : ''}">
                <span class="heatmap-label">${d.name}</span>
                <div class="heatmap-bar-track">
                  <div class="heatmap-bar level-${level}" style="width: ${d.count === 0 ? 0 : Math.max(8, (d.count / maxCount) * 100)}%"></div>
                </div>
                <span class="heatmap-count">${d.count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function renderTopicSummary() {
    if (typeof TOPIC_REGISTRY === 'undefined') return '';
    const active = SRS.getActiveTopics();
    let label;
    if (active.length === 0) {
      label = 'All Topics';
    } else {
      const names = active.map(id => {
        const t = TOPIC_REGISTRY.find(r => r.id === id);
        return t ? t.name : id;
      });
      label = names.length <= 2 ? names.join(', ') : names.slice(0, 2).join(', ') + ' +' + (names.length - 2);
    }
    return `
      <div class="topic-summary" onclick="App.navigate('topics')">
        <span class="topic-summary-label">Topics</span>
        <span class="topic-summary-value">${label}</span>
        <span class="topic-summary-arrow">&#8250;</span>
      </div>
    `;
  }

  function renderTopics() {
    if (typeof TOPIC_REGISTRY === 'undefined') return '<div>Topics not available</div>';
    const active = SRS.getActiveTopics();
    const activeSet = new Set(active);
    const counts = typeof WORD_INDEX !== 'undefined' ? WORD_INDEX.getAllTopicCounts() : {};
    const states = SRS.getAllCardStates();

    return `
      <div class="fade-in">
        <div class="header">
          <h1>Topics</h1>
        </div>

        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
          Select topics for new cards. Review cards are not affected by topic filters.
        </p>

        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="filter-tab ${active.length === 0 ? 'active' : ''}" onclick="App.clearAllTopics()">All Topics</button>
          <button class="filter-tab" onclick="App.selectAllTopics()">Select All</button>
          <button class="filter-tab" onclick="App.clearAllTopics()">Clear All</button>
        </div>

        <div class="topic-grid">
          ${TOPIC_REGISTRY.map(topic => {
            const isActive = activeSet.has(topic.id);
            const wordCount = counts[topic.id] || 0;
            // Calculate learned count for this topic
            let learnedCount = 0;
            if (typeof WORD_INDEX !== 'undefined') {
              const words = WORD_INDEX.getByTopic(topic.id);
              for (const w of words) {
                if (states[w.id]) learnedCount++;
              }
            }
            const pct = wordCount > 0 ? Math.round((learnedCount / wordCount) * 100) : 0;
            return `
              <div class="topic-card ${isActive ? 'active' : ''}" onclick="App.toggleTopic('${topic.id}')">
                <div class="topic-card-emoji">${topic.emoji}</div>
                <div class="topic-card-info">
                  <div class="topic-card-name">${topic.name}</div>
                  <div class="topic-card-meta">${wordCount} words &middot; ${pct}% learned</div>
                </div>
                <div class="topic-card-check">${isActive ? '&#10003;' : ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function toggleTopic(topicId) {
    const active = SRS.getActiveTopics();
    const idx = active.indexOf(topicId);
    if (idx >= 0) {
      active.splice(idx, 1);
    } else {
      active.push(topicId);
    }
    SRS.setActiveTopics(active);
    SRS.clearCache();
    render();
  }

  function selectAllTopics() {
    if (typeof TOPIC_REGISTRY === 'undefined') return;
    SRS.setActiveTopics(TOPIC_REGISTRY.map(t => t.id));
    SRS.clearCache();
    render();
  }

  function clearAllTopics() {
    SRS.setActiveTopics([]);
    SRS.clearCache();
    render();
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

    // Escape single quotes in word for onclick handlers
    const escapedWord = word.word.replace(/'/g, "\\'");

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
            <div class="audio-controls">
              <button class="audio-btn" onclick="event.stopPropagation(); App.speak('${escapedWord}')" title="Play pronunciation">
                &#9654;
              </button>
              <button class="audio-btn audio-btn-slow" onclick="event.stopPropagation(); App.speakSlow('${escapedWord}')" title="Play slowly">
                &#9654;&frac12;
              </button>
            </div>
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
              ${word.examples.map(ex => {
                const escapedEx = ex.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `
                  <li>
                    <span class="example-text">${ex}</span>
                    <button class="example-play-btn" onclick="event.stopPropagation(); App.speakSentence('${escapedEx}')" title="Play sentence">&#9654;</button>
                  </li>
                `;
              }).join('')}
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
      // Filter by topic
      if (wordListTopic !== 'all') {
        const topics = w.topics || [];
        if (!topics.includes(wordListTopic)) return false;
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

        ${typeof TOPIC_REGISTRY !== 'undefined' ? `
          <select class="topic-select" onchange="App.setTopicFilter(this.value)">
            <option value="all" ${wordListTopic === 'all' ? 'selected' : ''}>All Topics</option>
            ${TOPIC_REGISTRY.map(t => `
              <option value="${t.id}" ${wordListTopic === t.id ? 'selected' : ''}>${t.emoji} ${t.name}</option>
            `).join('')}
          </select>
        ` : ''}

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
    const autoPlay = typeof AudioPlayer !== 'undefined' ? AudioPlayer.getAutoPlay() : true;

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
          <div class="settings-section-title">Audio</div>
          <div class="settings-item">
            <span class="settings-label">Auto-play pronunciation</span>
            <div class="settings-value">
              <button class="toggle-btn ${autoPlay ? 'active' : ''}" onclick="App.toggleAutoPlay()">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Statistics</div>
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
    const escapedWord = word.word.replace(/'/g, "\\'");

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
            <div class="audio-controls">
              <button class="audio-btn" onclick="App.speak('${escapedWord}')" title="Play">&#9654;</button>
              <button class="audio-btn audio-btn-slow" onclick="App.speakSlow('${escapedWord}')" title="Slow">&#9654;&frac12;</button>
            </div>
            <span class="word-item-badge badge-${state}">${state}</span>
          </div>

          <div class="card-zh" style="font-size:20px">${word.zh}</div>
          <div class="card-en" style="margin-top:8px">${word.en}</div>

          <ul class="card-examples" style="margin-top:12px">
            ${word.examples.map(ex => {
              const escapedEx = ex.replace(/'/g, "\\'").replace(/"/g, '&quot;');
              return `
                <li>
                  <span class="example-text">${ex}</span>
                  <button class="example-play-btn" onclick="App.speakSentence('${escapedEx}')" title="Play sentence">&#9654;</button>
                </li>
              `;
            }).join('')}
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
          <button class="nav-item ${currentScreen === 'topics' ? 'active' : ''}"
                  onclick="App.navigate('topics')">
            <span class="nav-icon">&#127991;</span>
            Topics
          </button>
          <button class="nav-item ${currentScreen === 'wordlist' ? 'active' : ''}"
                  onclick="App.navigate('wordlist')">
            <span class="nav-icon">&#128218;</span>
            Words
          </button>
          <button class="nav-item ${currentScreen === 'reading' ? 'active' : ''}"
                  onclick="App.navigate('reading')">
            <span class="nav-icon">&#128196;</span>
            Read
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

  // --- Reading / Passages ---

  function getPassagesRead() {
    try {
      const raw = localStorage.getItem('passages_read');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function savePassagesRead(list) {
    localStorage.setItem('passages_read', JSON.stringify(list));
  }

  function getLearnedWordIds() {
    // Returns a Set of word IDs the user has started learning (state != 'unseen')
    const states = SRS.getAllCardStates();
    const learned = new Set();
    for (const id in states) {
      if (states[id] !== 'unseen') {
        learned.add(Number(id));
      }
    }
    return learned;
  }

  function getPassageCoverage(passage, learnedIds) {
    if (!passage.wordIds || passage.wordIds.length === 0) return 0;
    let known = 0;
    for (const wid of passage.wordIds) {
      if (learnedIds.has(wid)) known++;
    }
    return known / passage.wordIds.length;
  }

  function getReadyPassages() {
    if (typeof PASSAGES === 'undefined' || PASSAGES.length === 0) return [];
    const learnedIds = getLearnedWordIds();
    const readList = getPassagesRead();
    const readSet = new Set(readList);

    const ready = [];
    for (const p of PASSAGES) {
      if (readSet.has(p.id)) continue;
      const coverage = getPassageCoverage(p, learnedIds);
      if (coverage >= 0.8) {
        ready.push({ passage: p, coverage });
      }
    }

    // Sort by coverage descending (most relevant first)
    ready.sort((a, b) => b.coverage - a.coverage);
    return ready;
  }

  function getCompletedPassages() {
    if (typeof PASSAGES === 'undefined' || PASSAGES.length === 0) return [];
    const readList = getPassagesRead();
    const readSet = new Set(readList);
    return PASSAGES.filter(p => readSet.has(p.id));
  }

  function openPassage(passageId) {
    readingPassageId = passageId;
    readingTooltipWordId = null;
    currentScreen = 'passage';
    render();
  }

  function closePassage() {
    readingPassageId = null;
    readingTooltipWordId = null;
    navigate('reading');
  }

  function markPassageRead(passageId) {
    const list = getPassagesRead();
    if (!list.includes(passageId)) {
      list.push(passageId);
      savePassagesRead(list);
    }
    closePassage();
  }

  function toggleReadingTooltip(wordId) {
    if (readingTooltipWordId === wordId) {
      readingTooltipWordId = null;
    } else {
      readingTooltipWordId = wordId;
    }
    render();
  }

  function playPassageAudio(passageId) {
    if (typeof PASSAGES === 'undefined') return;
    const passage = PASSAGES.find(p => p.id === passageId);
    if (passage) {
      speakSentence(passage.text);
    }
  }

  function renderReading() {
    const ready = getReadyPassages();
    const completed = getCompletedPassages();
    const hasPassages = typeof PASSAGES !== 'undefined' && PASSAGES.length > 0;

    return `
      <div class="fade-in">
        <div class="header">
          <h1>Reading</h1>
        </div>

        ${!hasPassages ? `
          <div class="reading-empty">
            <div class="reading-empty-icon">&#128214;</div>
            <h3>No passages available yet</h3>
            <p>Passages will appear here as content is added.</p>
          </div>
        ` : ready.length === 0 && completed.length === 0 ? `
          <div class="reading-empty">
            <div class="reading-empty-icon">&#128214;</div>
            <h3>Keep learning!</h3>
            <p>Passages unlock when you've learned 80% of their vocabulary. Keep studying to unlock your first passage.</p>
          </div>
        ` : `
          ${ready.length > 0 ? `
            <div class="reading-section-title">Available to Read</div>
            <div class="passage-list">
              ${ready.map(({ passage, coverage }) => `
                <div class="passage-item" onclick="App.openPassage(${passage.id})">
                  <div class="passage-item-info">
                    <div class="passage-item-title">${passage.title}</div>
                    <div class="passage-item-meta">
                      <span class="passage-topic">${formatTopic(passage.topic)}</span>
                      <span class="passage-level">${passage.level}</span>
                      <span class="passage-words">${passage.wordIds.length} target words</span>
                    </div>
                  </div>
                  <div class="passage-coverage">
                    <div class="passage-coverage-bar">
                      <div class="passage-coverage-fill" style="width: ${Math.round(coverage * 100)}%"></div>
                    </div>
                    <span class="passage-coverage-text">${Math.round(coverage * 100)}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${completed.length > 0 ? `
            <div class="reading-section-title" style="margin-top: 24px">Completed</div>
            <div class="passage-list">
              ${completed.map(p => `
                <div class="passage-item completed" onclick="App.openPassage(${p.id})">
                  <div class="passage-item-info">
                    <div class="passage-item-title">${p.title}</div>
                    <div class="passage-item-meta">
                      <span class="passage-topic">${formatTopic(p.topic)}</span>
                      <span class="passage-level">${p.level}</span>
                    </div>
                  </div>
                  <span class="passage-done-badge">&#10003; Read</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `}
      </div>
    `;
  }

  function formatTopic(topic) {
    if (!topic) return '';
    return topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function renderPassage() {
    if (typeof PASSAGES === 'undefined' || !readingPassageId) return renderReading();
    const passage = PASSAGES.find(p => p.id === readingPassageId);
    if (!passage) return renderReading();

    const learnedIds = getLearnedWordIds();
    const wordMap = {};
    for (const wid of passage.wordIds) {
      const w = getWord(wid);
      if (w) wordMap[w.word.toLowerCase()] = w;
    }

    // Build highlighted text
    const highlightedText = buildHighlightedText(passage.text, wordMap);

    const isRead = getPassagesRead().includes(passage.id);

    return `
      <div class="passage-screen fade-in">
        <div class="card-header">
          <button class="back-btn" onclick="App.closePassage()">&#8592; Back</button>
          <span class="card-progress">${passage.level} &middot; ${formatTopic(passage.topic)}</span>
        </div>

        <div class="passage-content">
          <h2 class="passage-title">${passage.title}</h2>
          <div class="passage-text">
            ${highlightedText}
          </div>

          ${readingTooltipWordId !== null ? renderWordTooltip(readingTooltipWordId) : ''}
        </div>

        <div class="passage-actions">
          <button class="btn btn-secondary passage-action-btn" onclick="App.playPassageAudio(${passage.id})">
            &#9654; Play Audio
          </button>
          ${!isRead ? `
            <button class="btn btn-primary passage-action-btn" onclick="App.markPassageRead(${passage.id})">
              &#10003; Mark as Read
            </button>
          ` : `
            <div class="passage-already-read">&#10003; Already read</div>
          `}
        </div>
      </div>
    `;
  }

  function buildHighlightedText(text, wordMap) {
    // Tokenize text and highlight target words
    // We need to match whole words case-insensitively
    const wordKeys = Object.keys(wordMap);
    if (wordKeys.length === 0) return escapeHtml(text);

    // Build regex pattern for all target words (longest first to match compound forms)
    const sorted = wordKeys.sort((a, b) => b.length - a.length);
    const pattern = new RegExp('\\b(' + sorted.map(w => escapeRegex(w)).join('|') + ')\\b', 'gi');

    let result = '';
    let lastIndex = 0;

    text.replace(pattern, (match, word, offset) => {
      // Add text before this match
      result += escapeHtml(text.slice(lastIndex, offset));
      // Add highlighted word
      const w = wordMap[match.toLowerCase()];
      if (w) {
        result += `<span class="highlight-word" onclick="event.stopPropagation(); App.toggleReadingTooltip(${w.id})">${escapeHtml(match)}</span>`;
      } else {
        result += escapeHtml(match);
      }
      lastIndex = offset + match.length;
    });

    // Add remaining text
    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderWordTooltip(wordId) {
    const word = getWord(wordId);
    if (!word) return '';
    const escapedWord = word.word.replace(/'/g, "\\'");

    return `
      <div class="reading-tooltip" onclick="event.stopPropagation()">
        <div class="reading-tooltip-close" onclick="App.toggleReadingTooltip(${wordId})">&#10005;</div>
        <div class="reading-tooltip-word">${word.word} <span class="reading-tooltip-pos">${word.pos}</span></div>
        <div class="reading-tooltip-phonetic">${word.phonetic}
          <button class="example-play-btn" onclick="App.speak('${escapedWord}')" title="Play">&#9654;</button>
        </div>
        <div class="reading-tooltip-zh">${word.zh}</div>
        <div class="reading-tooltip-en">${word.en}</div>
      </div>
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

  function setTopicFilter(topicId) {
    wordListTopic = topicId;
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

  function toggleAutoPlay() {
    if (typeof AudioPlayer !== 'undefined') {
      const current = AudioPlayer.getAutoPlay();
      AudioPlayer.setAutoPlay(!current);
      render();
    }
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

    // P key to play pronunciation on card screen
    if (e.key === 'p' || e.key === 'P') {
      const card = getCurrentCard();
      if (card) {
        const word = getWord(card.wordId);
        if (word) speak(word.word);
      }
    }

    // Esc to go back to dashboard
    if (e.key === 'Escape') {
      navigate('dashboard');
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
    speakSlow,
    speakSentence,
    toggleTheme,
    setTheme,
    toggleAutoPlay,
    onSearchInput,
    setFilter,
    setTopicFilter,
    toggleTopic,
    selectAllTopics,
    clearAllTopics,
    loadMoreWords,
    showWordDetail,
    closeModal,
    setNewCardsPerDay,
    confirmReset,
    openPassage,
    closePassage,
    markPassageRead,
    toggleReadingTooltip,
    playPassageAudio
  };
})();
