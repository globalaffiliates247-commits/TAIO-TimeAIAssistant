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
  const btnModeRemaining = document.getElementById('btnModeRemaining');
  const btnModeElapsed = document.getElementById('btnModeElapsed');
  const btnModeGoal = document.getElementById('btnModeGoal');
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
  document.getElementById('barBtnExtend15')?.addEventListener('click', () => triggerExtend(15));
  document.getElementById('ringBtnExtend')?.addEventListener('click', () => triggerExtend(5));
  document.getElementById('ringBtnExtend15')?.addEventListener('click', () => triggerExtend(15));
  document.getElementById('barBtnDone')?.addEventListener('click', triggerDone);
  document.getElementById('ringBtnDone')?.addEventListener('click', triggerDone);

  // Three view modes (v0.3.34 Part E4: 1=remaining, 2=elapsed, 3=goal)
  let threeViewMode = 'remaining';
  try {
    const saved3 = localStorage.getItem('taio_clock_three_view_mode');
    if (saved3 === 'remaining' || saved3 === 'elapsed' || saved3 === 'goal') threeViewMode = saved3;
  } catch {}

  function setThreeViewMode(mode) {
    threeViewMode = mode;
    try { localStorage.setItem('taio_clock_three_view_mode', mode); } catch {}
    btnModeRemaining?.classList.toggle('active', mode === 'remaining');
    btnModeElapsed?.classList.toggle('active', mode === 'elapsed');
    btnModeGoal?.classList.toggle('active', mode === 'goal');
    tick();
  }
  setThreeViewMode(threeViewMode);

  btnModeRemaining?.addEventListener('click', () => setThreeViewMode('remaining'));
  btnModeElapsed?.addEventListener('click', () => setThreeViewMode('elapsed'));
  btnModeGoal?.addEventListener('click', () => setThreeViewMode('goal'));

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

  // Keyboard shortcuts (N, V, P, 1, 2, 3)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (key === 'n') {
      triggerOpenJournal();
    } else if (key === 'v') {
      setViewMode(viewMode === 'bar' ? 'ring' : 'bar');
    } else if (key === 'p') {
      btnPin.click();
    } else if (key === '1') {
      setThreeViewMode('remaining');
    } else if (key === '2') {
      setThreeViewMode('elapsed');
    } else if (key === '3') {
      setThreeViewMode('goal');
    }
  });

  let lastData = null;

  // UI Update called from main.js syncClockWindowData
  window.updateUI = function(data) {
    if (!data) return;
    lastData = data;
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
      const title = data.title || (currentLang === 'vi' ? 'Bạn đang làm gì?' : 'What are you doing?');
      const sub = data.subtitle || '';
      barTitle.innerText = title;
      ringTitle.innerText = title;
      barSubtitle.innerText = sub;
      ringSubtitle.innerText = sub;

      barBottomBar.style.display = 'none';
      ringBottomBar.style.display = 'none';
      barProgressTrack.style.display = 'block';
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
      tick();
    }
  };

  function tick() {
    if (currentMode === 'template_or_current') return;
    const now = Date.now();
    let digitsStr = '00:00';
    let sublineStr = '';
    let fraction = 1;

    if (currentMode === 'gap') {
      if (threeViewMode === 'remaining') {
        digitsStr = '00:00';
        sublineStr = currentLang === 'vi' ? 'chưa ghi nhận' : 'unassigned';
      } else if (threeViewMode === 'elapsed') {
        digitsStr = '00:00';
        sublineStr = currentLang === 'vi' ? 'tới việc kế tiếp' : 'until next';
      } else {
        digitsStr = '0g00';
        sublineStr = currentLang === 'vi' ? '/ 9g thời gian thức' : '/ 9h awake';
      }
      barDigits.innerText = digitsStr;
      ringDigits.innerText = digitsStr;
      ringSubText.innerText = sublineStr;
      barProgress.style.width = '100%';
      if (ringCircle) ringCircle.style.strokeDashoffset = '0';
      return;
    }

    // Active task
    const totalSec = Math.max(60, Math.floor((endsAt - (startedAt || (now - 1000))) / 1000));
    const totalDurationMins = Math.round(totalSec / 60);

    if (threeViewMode === 'remaining') {
      if (now > endsAt && endsAt > 0) {
        const overrunMins = Math.max(1, Math.floor((now - endsAt) / 60000));
        digitsStr = currentLang === 'vi' ? `quá ${overrunMins}p` : `over ${overrunMins}m`;
        sublineStr = currentLang === 'vi' ? 'đã quá hạn' : 'overrun';
        fraction = 1;
      } else {
        const secRemaining = Math.max(0, Math.floor((endsAt - now) / 1000));
        const m = Math.floor(secRemaining / 60);
        const s = secRemaining % 60;
        digitsStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        sublineStr = `${currentLang === 'vi' ? 'còn lại' : 'remaining'} / ${totalDurationMins}p`;
        fraction = totalSec > 0 ? Math.max(0, Math.min(1, secRemaining / totalSec)) : 0;
      }
    } else if (threeViewMode === 'elapsed') {
      const secElapsed = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
      const m = Math.floor(secElapsed / 60);
      const s = secElapsed % 60;
      digitsStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      sublineStr = `${currentLang === 'vi' ? 'đã dùng' : 'elapsed'} / ${totalDurationMins}p`;
      fraction = totalSec > 0 ? Math.max(0, Math.min(1, secElapsed / totalSec)) : 0;
    } else if (threeViewMode === 'goal') {
      const gh = lastData?.goalHours || 0;
      const gm = lastData?.goalMins || 0;
      digitsStr = `${gh}g${gm > 0 ? (gm < 10 ? '0' : '') + gm : ''}`;
      if (lastData?.goalTitle) {
        sublineStr = lastData?.goalSize
          ? `/ ${lastData.goalTargetHours || 40}g · ${lastData.goalSize}`
          : `/ ${lastData.goalTargetHours || 40}g`;
        fraction = Math.min(1, ((gh * 60 + gm) / ((lastData.goalTargetHours || 40) * 60)));
      } else {
        sublineStr = currentLang === 'vi' ? 'Chưa gắn mục tiêu' : 'No goal';
        fraction = 0;
      }
    }

    barDigits.innerText = digitsStr;
    ringDigits.innerText = digitsStr;
    ringSubText.innerText = sublineStr;

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
