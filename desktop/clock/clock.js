// TAIO Clock Window Controller (PRD v0.3.33 Part I)
(() => {
  let endsAt = 0;
  let startedAt = 0;
  let isCountDown = true;
  let isPinned = true;
  let currentMode = 'task';
  let currentTaskId = null;
  let currentQuote = { text: 'Vạn dặm khởi đầu từ một bước chân', author: 'Lão Tử' };
  let currentLang = 'vi';

  // Elements
  const barView = document.getElementById('barView');
  const ringView = document.getElementById('ringView');
  const barTitle = document.getElementById('barTitle');
  const ringTitle = document.getElementById('ringTitle');
  const barSubtitle = document.getElementById('barSubtitle');
  const ringSubtitle = document.getElementById('ringSubtitle');
  const barDigits = document.getElementById('barDigits');
  const ringDigits = document.getElementById('ringDigits');
  const ringSubText = document.getElementById('ringSubText');
  const barProgress = document.getElementById('barProgress');
  const ringCircle = document.getElementById('ringCircle');
  const btnPin = document.getElementById('btnPin');
  const btnClose = document.getElementById('btnClose');
  const btnJournal = document.getElementById('btnJournal');
  const btnViewMode = document.getElementById('btnViewMode');
  const barBottomBar = document.getElementById('barBottomBar');
  const ringBottomBar = document.getElementById('ringBottomBar');
  const barProgressTrack = document.getElementById('barProgressTrack');
  const barFreeTimerRow = document.getElementById('barFreeTimerRow');
  const barFreeTimerTitle = document.getElementById('barFreeTimerTitle');
  const barFreeTimerDigits = document.getElementById('barFreeTimerDigits');
  const quoteText = document.getElementById('quoteText');
  const quoteModal = document.getElementById('quoteModal');
  const modalQuoteContent = document.getElementById('modalQuoteContent');
  const modalQuoteAuthor = document.getElementById('modalQuoteAuthor');
  const btnQuoteClose = document.getElementById('btnQuoteClose');
  const btnQuoteNext = document.getElementById('btnQuoteNext');
  const btnQuoteFav = document.getElementById('btnQuoteFav');

  // Ring geometry
  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;
  if (ringCircle) {
    ringCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
  }

  // Load persisted view mode (bar vs ring)
  let viewMode = 'bar';
  try {
    const saved = localStorage.getItem('taio_clock_view_mode');
    if (saved === 'ring' || saved === 'bar') viewMode = saved;
  } catch {}

  function setViewMode(mode) {
    viewMode = mode;
    try { localStorage.setItem('taio_clock_view_mode', mode); } catch {}
    if (viewMode === 'ring') {
      barView.style.display = 'none';
      ringView.style.display = 'flex';
      btnViewMode.title = currentLang === 'en' ? 'Switch to Bar view (V)' : 'Đổi sang kiểu Thanh (V)';
    } else {
      ringView.style.display = 'none';
      barView.style.display = 'flex';
      btnViewMode.title = currentLang === 'en' ? 'Switch to Ring view (V)' : 'Đổi sang kiểu Vòng tròn (V)';
    }
  }
  setViewMode(viewMode);

  // Toggle view mode
  btnViewMode.addEventListener('click', () => {
    setViewMode(viewMode === 'bar' ? 'ring' : 'bar');
  });

  // Open Today's Journal
  function triggerOpenJournal() {
    if (window.taioAPI && window.taioAPI.openTodayJournal) {
      window.taioAPI.openTodayJournal(currentTaskId);
    }
  }
  btnJournal.addEventListener('click', triggerOpenJournal);
  barTitle.addEventListener('click', triggerOpenJournal);
  ringTitle.addEventListener('click', triggerOpenJournal);

  // Pin toggle
  btnPin.addEventListener('click', () => {
    isPinned = !isPinned;
    btnPin.classList.toggle('active', isPinned);
    if (window.taioAPI && window.taioAPI.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'toggle-pin', pinned: isPinned });
    }
  });

  // Close window
  btnClose.addEventListener('click', () => {
    window.close();
  });

  // Action buttons
  function triggerExtend(mins) {
    if (window.taioAPI && window.taioAPI.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'extend', minutes: mins });
    }
  }
  function triggerDone() {
    if (window.taioAPI && window.taioAPI.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'done' });
    }
  }

  document.getElementById('barBtnExtend')?.addEventListener('click', () => triggerExtend(5));
  document.getElementById('ringBtnExtend')?.addEventListener('click', () => triggerExtend(5));
  document.getElementById('barBtnDone')?.addEventListener('click', triggerDone);
  document.getElementById('ringBtnDone')?.addEventListener('click', triggerDone);

  // Quote interactions
  quoteText.addEventListener('click', () => {
    modalQuoteContent.innerText = `"${currentQuote.text}"`;
    modalQuoteAuthor.innerText = currentQuote.author ? `— ${currentQuote.author}` : '';
    quoteModal.style.display = 'flex';
  });
  btnQuoteClose?.addEventListener('click', () => { quoteModal.style.display = 'none'; });
  btnQuoteNext?.addEventListener('click', () => {
    if (window.taioAPI && window.taioAPI.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'next-quote' });
    }
    quoteModal.style.display = 'none';
  });
  btnQuoteFav?.addEventListener('click', () => {
    btnQuoteFav.style.color = '#e0401f';
    if (window.taioAPI && window.taioAPI.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'fav-quote', quote: currentQuote });
    }
  });

  // Keyboard shortcuts (N, V, P)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (key === 'n') {
      triggerOpenJournal();
    } else if (key === 'v') {
      setViewMode(viewMode === 'bar' ? 'ring' : 'bar');
    } else if (key === 'p') {
      btnPin.click();
    }
  });

  // UI Update called from main.js syncClockWindowData
  window.updateUI = function(data) {
    if (!data) return;
    currentMode = data.mode || 'task';
    currentTaskId = data.taskId || null;
    if (data.lang) currentLang = data.lang;

    if (data.endsAt) endsAt = data.endsAt;
    if (data.startedAt) startedAt = data.startedAt;
    if (typeof data.isCountDown === 'boolean') isCountDown = data.isCountDown;

    if (data.quote) {
      currentQuote = typeof data.quote === 'string' ? { text: data.quote, author: '' } : data.quote;
      quoteText.innerText = currentQuote.text;
    }

    // Free timer row
    if (data.freeTimer && barFreeTimerRow) {
      barFreeTimerRow.style.display = 'flex';
      barFreeTimerTitle.innerText = data.freeTimer.title;
      barFreeTimerDigits.innerText = data.freeTimer.timeStr;
    } else if (barFreeTimerRow) {
      barFreeTimerRow.style.display = 'none';
    }

    // Display strings per I2.3
    if (currentMode === 'template_or_current') {
      const title = currentLang === 'en' ? 'Today Scheduled Done' : 'Hết việc có giờ hôm nay';
      const sub = data.subtitle || (data.title ? `Hiện tại: ${data.title}` : '');
      barTitle.innerText = title;
      ringTitle.innerText = title;
      barSubtitle.innerText = sub;
      ringSubtitle.innerText = sub;
      barDigits.innerText = data.title || '00:00';
      ringDigits.innerText = data.title || '00:00';
      ringSubText.innerText = currentLang === 'en' ? 'milestone' : 'mốc kế tiếp';

      barBottomBar.style.display = 'none';
      ringBottomBar.style.display = 'none';
      barProgressTrack.style.display = 'none';
    } else if (currentMode === 'gap') {
      // Clean display without unclosed parenthesis
      const title = data.title || (currentLang === 'en' ? 'Free' : 'Trống');
      const sub = data.subtitle || '';
      barTitle.innerText = title;
      ringTitle.innerText = title;
      barSubtitle.innerText = sub;
      ringSubtitle.innerText = sub;

      barBottomBar.style.display = 'none';
      ringBottomBar.style.display = 'none';
      barProgressTrack.style.display = 'block';
      ringSubText.innerText = currentLang === 'en' ? 'until next' : 'nữa tới';
      tick();
    } else {
      // In Task
      const title = data.title || (currentLang === 'en' ? 'In progress' : 'Đang làm');
      const sub = data.subtitle || '';
      barTitle.innerText = title;
      ringTitle.innerText = title;
      barSubtitle.innerText = sub;
      ringSubtitle.innerText = sub;

      barBottomBar.style.display = 'flex';
      ringBottomBar.style.display = 'flex';
      barProgressTrack.style.display = 'block';
      ringSubText.innerText = isCountDown ? (currentLang === 'en' ? 'remaining' : 'còn lại') : (currentLang === 'en' ? 'worked' : 'đã làm');
      tick();
    }
  };

  function tick() {
    if (currentMode === 'template_or_current') return;
    const now = Date.now();
    let secRemaining = 0;
    let totalSec = 1800;

    if (isCountDown) {
      secRemaining = Math.max(0, Math.floor((endsAt - now) / 1000));
      totalSec = Math.max(60, Math.floor((endsAt - (startedAt || (now - 1000))) / 1000));
    } else {
      secRemaining = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
      totalSec = Math.max(60, Math.floor((endsAt - (startedAt || now)) / 1000));
    }

    const m = Math.floor(secRemaining / 60);
    const s = secRemaining % 60;
    const digitsStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    barDigits.innerText = digitsStr;
    ringDigits.innerText = digitsStr;

    // Progress percentage
    let fraction = 1;
    if (totalSec > 0) {
      fraction = isCountDown
        ? Math.max(0, Math.min(1, secRemaining / totalSec))
        : Math.max(0, Math.min(1, secRemaining / totalSec));
    }

    // Bar progress width
    barProgress.style.width = `${Math.round(fraction * 100)}%`;

    // Ring progress circle
    if (ringCircle) {
      const offset = ringCircumference - fraction * ringCircumference;
      ringCircle.style.strokeDashoffset = offset;
    }
  }

  // Live timer tick every second
  setInterval(tick, 1000);
})();
