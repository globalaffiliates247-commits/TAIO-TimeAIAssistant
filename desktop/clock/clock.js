// TAIO Clock Window Controller (PRD v0.3.33 Part I & v0.3.46 Part A)
(() => {
  // State variables (v0.3.46 Part A1: ALL declared at top before any functions or calls)
  let endsAt = 0;
  let startedAt = 0;
  let isCountDown = true;
  let isPinned = true;
  let currentMode = 'gap';
  let currentTaskId = null;
  let currentQuote = { text: 'Vạn dặm khởi đầu từ một bước chân', author: 'Lão Tử' };
  let currentLang = 'vi';
  let viewMode = 'bar';
  let threeViewMode = 'remaining';
  let lastData = null;

  // Error reporter (v0.3.46 Part A4: Report clock errors back to main window error log)
  function reportError(err, context = '') {
    try {
      console.error(`[ClockWindow Error${context ? ' in ' + context : ''}]`, err);
      if (window.taioAPI && window.taioAPI.sendClockError) {
        window.taioAPI.sendClockError({
          message: err && err.message ? `[Clock ${context}] ${err.message}` : String(err),
          stack: err && err.stack ? err.stack : String(context || '')
        });
      }
    } catch {}
  }

  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, 'window.onerror');
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'unhandledrejection');
  });

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
  const barIdleBottomBar = document.getElementById('barIdleBottomBar');
  const ringIdleBottomBar = document.getElementById('ringIdleBottomBar');
  const barProgressTrack = document.getElementById('barProgressTrack');
  const barFreeTimersList = document.getElementById('barFreeTimersList');
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
  const ringWrapper = document.getElementById('ringWrapper');
  const motivationFooter = document.getElementById('motivationFooter');

  // Ring geometry
  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;
  if (ringCircle) {
    ringCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
  }

  function updateRingDimensions() {
    try {
      if (!ringView || ringView.style.display === 'none') return;
      const winW = window.innerWidth || document.documentElement?.clientWidth || 260;
      const winH = window.innerHeight || document.documentElement?.clientHeight || 140;

      const headerH = 22;
      const footerH = (motivationFooter && motivationFooter.style.display !== 'none') ? 16 : 0;
      const titleH = 18;
      const bottomBarH = (ringBottomBar && ringBottomBar.style.display !== 'none') ? 28 : 0;
      const overheadH = headerH + footerH + titleH + bottomBarH + 16;

      const availH = Math.max(48, winH - overheadH);
      const availW = Math.max(48, winW - 24);
      const ringSize = Math.max(50, Math.min(availH, availW, 130));

      if (ringWrapper) {
        ringWrapper.style.width = `${ringSize}px`;
        ringWrapper.style.height = `${ringSize}px`;
      }

      if (ringDigits) {
        const dSize = Math.max(12, Math.min(20, Math.floor(ringSize * 0.22)));
        ringDigits.style.fontSize = `${dSize}px`;
      }

      if (ringSubText) {
        if (ringSize < 65) {
          ringSubText.style.display = 'none';
        } else {
          ringSubText.style.display = 'block';
          const sSize = Math.max(7.5, Math.min(9.5, Math.floor(ringSize * 0.1)));
          ringSubText.style.fontSize = `${sSize}px`;
        }
      }
    } catch (err) {
      reportError(err, 'updateRingDimensions');
    }
  }

  window.addEventListener('resize', updateRingDimensions);

  // View mode switcher (bar vs ring)
  function setViewMode(mode) {
    try {
      viewMode = mode === 'ring' ? 'ring' : 'bar';
      try { localStorage.setItem('taio_clock_view_mode', viewMode); } catch {}
      if (viewMode === 'ring') {
        if (barView) barView.style.display = 'none';
        if (ringView) ringView.style.display = 'flex';
        if (btnViewMode) btnViewMode.title = currentLang === 'en' ? 'Switch to Bar view (V)' : 'Đổi sang kiểu Thanh (V)';
        updateRingDimensions();
      } else {
        if (ringView) ringView.style.display = 'none';
        if (barView) barView.style.display = 'flex';
        if (btnViewMode) btnViewMode.title = currentLang === 'en' ? 'Switch to Ring view (V)' : 'Đổi sang kiểu Vòng tròn (V)';
      }
    } catch (err) {
      reportError(err, 'setViewMode');
    }
  }

  // 1=remaining, 2=elapsed, 3=goal switcher
  function setThreeViewMode(mode) {
    try {
      if (mode !== 'remaining' && mode !== 'elapsed' && mode !== 'goal') {
        mode = 'remaining';
      }
      threeViewMode = mode;
      try { localStorage.setItem('taio_clock_three_view_mode', mode); } catch {}
      btnModeRemaining?.classList.toggle('active', mode === 'remaining');
      btnModeElapsed?.classList.toggle('active', mode === 'elapsed');
      btnModeGoal?.classList.toggle('active', mode === 'goal');
      tick();
    } catch (err) {
      reportError(err, 'setThreeViewMode');
      threeViewMode = 'remaining';
      try { localStorage.removeItem('taio_clock_three_view_mode'); } catch {}
      tick();
    }
  }

  // Open Today's Journal
  function triggerOpenJournal() {
    try {
      if (window.taioAPI && window.taioAPI.openTodayJournal) {
        window.taioAPI.openTodayJournal(currentTaskId);
      }
    } catch (err) {
      reportError(err, 'triggerOpenJournal');
    }
  }

  btnJournal?.addEventListener('click', triggerOpenJournal);
  barTitle?.addEventListener('click', triggerOpenJournal);
  ringTitle?.addEventListener('click', triggerOpenJournal);

  // Pin toggle
  btnPin?.addEventListener('click', () => {
    try {
      isPinned = !isPinned;
      btnPin.classList.toggle('active', isPinned);
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'toggle-pin', pinned: isPinned });
      }
    } catch (err) {
      reportError(err, 'btnPin click');
    }
  });

  // Close window
  btnClose?.addEventListener('click', () => {
    try {
      window.close();
    } catch {}
  });

  // Action buttons
  function triggerExtend(mins) {
    try {
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'extend', minutes: mins });
      }
    } catch (err) {
      reportError(err, 'triggerExtend');
    }
  }
  function triggerDone() {
    try {
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'done' });
      }
    } catch (err) {
      reportError(err, 'triggerDone');
    }
  }
  function triggerStartQuick(mins = 15) {
    try {
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'start-quick', minutes: mins });
      }
    } catch (err) {
      reportError(err, 'triggerStartQuick');
    }
  }

  document.getElementById('barBtnExtend')?.addEventListener('click', () => triggerExtend(5));
  document.getElementById('barBtnExtend15')?.addEventListener('click', () => triggerExtend(15));
  document.getElementById('ringBtnExtend')?.addEventListener('click', () => triggerExtend(5));
  document.getElementById('ringBtnExtend15')?.addEventListener('click', () => triggerExtend(15));
  document.getElementById('barBtnDone')?.addEventListener('click', triggerDone);
  document.getElementById('ringBtnDone')?.addEventListener('click', triggerDone);
  document.getElementById('barBtnQuick15')?.addEventListener('click', () => triggerStartQuick(15));
  document.getElementById('ringBtnQuick15')?.addEventListener('click', () => triggerStartQuick(15));
  document.getElementById('barBtnOpenJournal')?.addEventListener('click', triggerOpenJournal);
  document.getElementById('ringBtnOpenJournal')?.addEventListener('click', triggerOpenJournal);

  btnViewMode?.addEventListener('click', () => {
    setViewMode(viewMode === 'bar' ? 'ring' : 'bar');
  });

  btnModeRemaining?.addEventListener('click', () => setThreeViewMode('remaining'));
  btnModeElapsed?.addEventListener('click', () => setThreeViewMode('elapsed'));
  btnModeGoal?.addEventListener('click', () => setThreeViewMode('goal'));

  // Quote modal interactions
  quoteText?.addEventListener('click', () => {
    try {
      let content = `"${currentQuote.text}"`;
      if (currentQuote.originalText && currentQuote.originalText !== currentQuote.text) {
        content += `\n\n(Nguyên văn [${currentQuote.originalLang || 'en'}]: "${currentQuote.originalText}")`;
      }
      if (modalQuoteContent) modalQuoteContent.innerText = content;
      if (modalQuoteAuthor) modalQuoteAuthor.innerText = currentQuote.author ? `— ${currentQuote.author}` : '';
      if (quoteModal) quoteModal.style.display = 'flex';
    } catch (err) {
      reportError(err, 'quoteText click');
    }
  });
  btnQuoteClose?.addEventListener('click', () => { if (quoteModal) quoteModal.style.display = 'none'; });
  btnQuoteNext?.addEventListener('click', () => {
    try {
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'next-quote' });
      }
      if (quoteModal) quoteModal.style.display = 'none';
    } catch (err) {
      reportError(err, 'btnQuoteNext click');
    }
  });
  btnQuoteFav?.addEventListener('click', () => {
    try {
      btnQuoteFav.style.color = 'var(--taio-brand)';
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({ type: 'fav-quote', quote: currentQuote });
      }
    } catch (err) {
      reportError(err, 'btnQuoteFav click');
    }
  });

  // Keyboard shortcuts (N, V, P, 1, 2, 3)
  window.addEventListener('keydown', (e) => {
    try {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const key = e.key ? e.key.toLowerCase() : '';
      if (key === 'n') {
        triggerOpenJournal();
      } else if (key === 'v') {
        setViewMode(viewMode === 'bar' ? 'ring' : 'bar');
      } else if (key === 'p') {
        btnPin?.click();
      } else if (key === '1') {
        setThreeViewMode('remaining');
      } else if (key === '2') {
        setThreeViewMode('elapsed');
      } else if (key === '3') {
        setThreeViewMode('goal');
      }
    } catch (err) {
      reportError(err, 'keydown');
    }
  });

  // Free timer action handler (PRD v0.3.48 Part C4)
  window.handleFreeTimerAction = function(actionType, timerId) {
    try {
      if (window.taioAPI && window.taioAPI.sendTimerAction) {
        window.taioAPI.sendTimerAction({
          type: actionType === 'stop' ? 'free-timer-stop' : 'free-timer-done',
          timerId: timerId,
        });
      }
    } catch (err) {
      reportError(err, 'handleFreeTimerAction');
    }
  };

  // UI Update called from main.js syncClockWindowData (v0.3.46: guaranteed to be defined unconditionally)
  window.updateUI = function(data) {
    try {
      if (!data) return;
      lastData = data;
      currentMode = data.mode || (typeof data.endsAt === 'number' && data.endsAt > 0 ? 'task' : 'gap');
      currentTaskId = data.taskId || null;
      if (data.lang) currentLang = data.lang;

      if (data.palette) {
        document.documentElement.setAttribute('data-palette', data.palette);
      }
      if (data.theme) {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }

      endsAt = typeof data.endsAt === 'number' ? data.endsAt : 0;
      startedAt = typeof data.startedAt === 'number' ? data.startedAt : 0;
      if (typeof data.isCountDown === 'boolean') isCountDown = data.isCountDown;

      if (data.quote) {
        currentQuote = typeof data.quote === 'string' ? { text: data.quote, author: '' } : data.quote;
        if (quoteText) quoteText.innerText = currentQuote.text;
      }

      // Free timers list (up to 3 independent timers, PRD v0.3.48 Part C4)
      const freeTimers = Array.isArray(data.freeTimers)
        ? data.freeTimers.slice(0, 3)
        : (data.freeTimer ? [data.freeTimer] : []);

      if (barFreeTimersList) {
        if (freeTimers.length > 0) {
          barFreeTimersList.style.display = 'flex';
          barFreeTimersList.innerHTML = freeTimers.map(ft => `
            <div class="free-timer-item">
              <span class="free-timer-title" title="${ft.title || ''}">${ft.title || 'Timer'}</span>
              <span class="free-timer-digits">${ft.timeStr || '--:--'}</span>
              <div class="free-timer-actions">
                <button class="ft-btn" onclick="handleFreeTimerAction('stop', '${ft.id}')" title="Dừng">Dừng</button>
                <button class="ft-btn ft-done" onclick="handleFreeTimerAction('done', '${ft.id}')" title="Xong">✓</button>
              </div>
            </div>
          `).join('');
        } else {
          barFreeTimersList.style.display = 'none';
          barFreeTimersList.innerHTML = '';
        }
      } else if (data.freeTimer && barFreeTimerRow) {
        barFreeTimerRow.style.display = 'flex';
        if (barFreeTimerTitle) barFreeTimerTitle.innerText = data.freeTimer.title;
        if (barFreeTimerDigits) barFreeTimerDigits.innerText = data.freeTimer.timeStr;
      } else if (barFreeTimerRow) {
        barFreeTimerRow.style.display = 'none';
      }

      // Display strings per I2.3
      if (currentMode === 'template_or_current') {
        const title = currentLang === 'en' ? 'Today Scheduled Done' : 'Hết việc có giờ hôm nay';
        const sub = data.subtitle || (data.title ? `Hiện tại: ${data.title}` : '');
        if (barTitle) barTitle.innerText = title;
        if (ringTitle) ringTitle.innerText = title;
        if (barSubtitle) barSubtitle.innerText = sub;
        if (ringSubtitle) ringSubtitle.innerText = sub;
        if (barDigits) barDigits.innerText = data.title || '00:00';
        if (ringDigits) ringDigits.innerText = data.title || '00:00';
        if (ringSubText) ringSubText.innerText = currentLang === 'en' ? 'milestone' : 'mốc kế tiếp';

        if (barBottomBar) barBottomBar.style.display = 'none';
        if (ringBottomBar) ringBottomBar.style.display = 'none';
        if (barIdleBottomBar) barIdleBottomBar.style.display = 'flex';
        if (ringIdleBottomBar) ringIdleBottomBar.style.display = 'flex';
        if (barProgressTrack) barProgressTrack.style.display = 'none';
        tick();
      } else if (currentMode === 'gap') {
        const title = data.title || (currentLang === 'vi' ? 'Trống' : 'Free');
        const sub = data.subtitle || (currentLang === 'vi' ? 'Chưa có việc đang làm' : 'No active task');
        if (barTitle) barTitle.innerText = title;
        if (ringTitle) ringTitle.innerText = title;
        if (barSubtitle) barSubtitle.innerText = sub;
        if (ringSubtitle) ringSubtitle.innerText = sub;

        if (barBottomBar) barBottomBar.style.display = 'none';
        if (ringBottomBar) ringBottomBar.style.display = 'none';
        if (barIdleBottomBar) barIdleBottomBar.style.display = 'flex';
        if (ringIdleBottomBar) ringIdleBottomBar.style.display = 'flex';
        if (barProgressTrack) barProgressTrack.style.display = 'block';
        tick();
      } else {
        // In Task
        const title = data.title || (currentLang === 'en' ? 'In progress' : 'Đang làm');
        const sub = data.subtitle || '';
        if (barTitle) barTitle.innerText = title;
        if (ringTitle) ringTitle.innerText = title;
        if (barSubtitle) barSubtitle.innerText = sub;
        if (ringSubtitle) ringSubtitle.innerText = sub;

        if (barBottomBar) barBottomBar.style.display = 'flex';
        if (ringBottomBar) ringBottomBar.style.display = 'flex';
        if (barIdleBottomBar) barIdleBottomBar.style.display = 'none';
        if (ringIdleBottomBar) ringIdleBottomBar.style.display = 'none';
        if (barProgressTrack) barProgressTrack.style.display = 'block';
        tick();
      }
    } catch (err) {
      reportError(err, 'updateUI');
    }
  };

  // Live timer tick function (v0.3.46 Part A3: isolated try/catch per tick)
  function tick() {
    try {
      const now = Date.now();
      let digitsStr = '00:00';
      let sublineStr = '';
      let fraction = 1;

      if (currentMode === 'template_or_current') {
        const nowD = new Date();
        const curH = String(nowD.getHours()).padStart(2, '0');
        const curM = String(nowD.getMinutes()).padStart(2, '0');
        const curTime = `${curH}:${curM}`;
        if (barDigits) barDigits.innerText = curTime;
        if (ringDigits) ringDigits.innerText = curTime;
        if (ringSubText) ringSubText.innerText = currentLang === 'vi' ? 'giờ hiện tại' : 'current time';
        if (barProgress) barProgress.style.width = '100%';
        if (ringCircle) ringCircle.style.strokeDashoffset = '0';
        return;
      }

      if (currentMode === 'gap') {
        const totalSec = Math.max(60, Math.floor((endsAt - (startedAt || (now - 1000))) / 1000));
        const secElapsed = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
        const e = totalSec > 0 ? Math.max(0, Math.min(1, secElapsed / totalSec)) : 0;

        if (endsAt > now && endsAt > 0) {
          const secRemaining = Math.max(0, Math.floor((endsAt - now) / 1000));
          const m = Math.floor(secRemaining / 60);
          const s = secRemaining % 60;
          digitsStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          sublineStr = currentLang === 'vi' ? 'tới việc kế tiếp' : 'until next task';
          fraction = 1 - e;
        } else {
          const nowD = new Date();
          const curH = String(nowD.getHours()).padStart(2, '0');
          const curM = String(nowD.getMinutes()).padStart(2, '0');
          digitsStr = `${curH}:${curM}`;
          sublineStr = currentLang === 'vi' ? 'thời gian trống' : 'free time';
          fraction = 1;
        }

        if (threeViewMode === 'elapsed') {
          const em = Math.floor(secElapsed / 60);
          const es = secElapsed % 60;
          digitsStr = `${String(em).padStart(2, '0')}:${String(es).padStart(2, '0')}`;
          sublineStr = currentLang === 'vi' ? 'thời gian trống' : 'gap time';
          fraction = e;
        } else if (threeViewMode === 'goal') {
          const gh = (lastData && typeof lastData.goalHours === 'number') ? lastData.goalHours : 0;
          const gm = (lastData && typeof lastData.goalMins === 'number') ? lastData.goalMins : 0;
          digitsStr = `${gh}g${gm > 0 ? (gm < 10 ? '0' : '') + gm : '00'}`;
          sublineStr = lastData?.goalTitle ? `${lastData.goalTitle}` : (currentLang === 'vi' ? 'Tiến độ mục tiêu' : 'Goal progress');
          fraction = 0;
        }

        if (barDigits) barDigits.innerText = digitsStr;
        if (ringDigits) ringDigits.innerText = digitsStr;
        if (ringSubText) ringSubText.innerText = sublineStr;

        // Bar progress (v0.3.47 Part C & v0.3.48 Part A)
        if (barProgress) {
          if (threeViewMode === 'remaining') {
            barProgress.style.left = `${Math.round(e * 100)}%`;
            barProgress.style.width = `${Math.round((1 - e) * 100)}%`;
          } else {
            barProgress.style.left = '0%';
            barProgress.style.width = `${Math.round(e * 100)}%`;
          }
        }

        // Ring progress circle (v0.3.47 Part C & v0.3.48 Part A)
        if (ringCircle) {
          if (threeViewMode === 'remaining') {
            const rem = 1 - e;
            ringCircle.style.strokeDasharray = `${rem * ringCircumference} ${ringCircumference}`;
            ringCircle.style.strokeDashoffset = `${-e * ringCircumference}`;
          } else {
            ringCircle.style.strokeDasharray = `${e * ringCircumference} ${ringCircumference}`;
            ringCircle.style.strokeDashoffset = '0';
          }
        }
        return;
      }

      // Active task
      if (currentMode === 'task' && (!endsAt || endsAt <= 0)) {
        const nowD = new Date();
        const curH = String(nowD.getHours()).padStart(2, '0');
        const curM = String(nowD.getMinutes()).padStart(2, '0');
        if (barDigits) barDigits.innerText = `${curH}:${curM}`;
        if (ringDigits) ringDigits.innerText = `${curH}:${curM}`;
        if (ringSubText) ringSubText.innerText = currentLang === 'vi' ? 'thời gian trống' : 'free time';
        if (barProgress) barProgress.style.width = '100%';
        if (ringCircle) ringCircle.style.strokeDashoffset = '0';
        return;
      }

      const totalSec = Math.max(60, Math.floor((endsAt - (startedAt || (now - 1000))) / 1000));
      const totalDurationMins = Math.round(totalSec / 60);
      const isOverrun = endsAt > 0 && now > endsAt;
      const secElapsed = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
      const e = totalSec > 0 ? Math.max(0, Math.min(1, secElapsed / totalSec)) : 0;

      if (threeViewMode === 'remaining') {
        if (isOverrun) {
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
          fraction = 1 - e;
        }
      } else if (threeViewMode === 'elapsed') {
        const m = Math.floor(secElapsed / 60);
        const s = secElapsed % 60;
        digitsStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        sublineStr = `${currentLang === 'vi' ? 'đã dùng' : 'elapsed'} / ${totalDurationMins}p`;
        fraction = e;
      } else if (threeViewMode === 'goal') {
        const gh = (lastData && typeof lastData.goalHours === 'number') ? lastData.goalHours : 0;
        const gm = (lastData && typeof lastData.goalMins === 'number') ? lastData.goalMins : 0;
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

      if (barDigits) barDigits.innerText = digitsStr;
      if (ringDigits) ringDigits.innerText = digitsStr;
      if (ringSubText) ringSubText.innerText = sublineStr;

      // Bar progress: Part C3
      if (barProgress) {
        if (isOverrun) {
          barProgress.style.left = '0%';
          barProgress.style.width = '100%';
        } else if (threeViewMode === 'remaining') {
          barProgress.style.left = `${Math.round(e * 100)}%`;
          barProgress.style.width = `${Math.round((1 - e) * 100)}%`;
        } else if (threeViewMode === 'goal') {
          barProgress.style.left = '0%';
          barProgress.style.width = `${Math.round(fraction * 100)}%`;
        } else {
          barProgress.style.left = '0%';
          barProgress.style.width = `${Math.round(e * 100)}%`;
        }
      }

      // Ring progress circle: Part C1
      if (ringCircle) {
        if (isOverrun) {
          ringCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
          ringCircle.style.strokeDashoffset = '0';
        } else if (threeViewMode === 'remaining') {
          const rem = 1 - e;
          ringCircle.style.strokeDasharray = `${rem * ringCircumference} ${ringCircumference}`;
          ringCircle.style.strokeDashoffset = `${-e * ringCircumference}`;
        } else if (threeViewMode === 'goal') {
          ringCircle.style.strokeDasharray = `${fraction * ringCircumference} ${ringCircumference}`;
          ringCircle.style.strokeDashoffset = '0';
        } else {
          ringCircle.style.strokeDasharray = `${e * ringCircumference} ${ringCircumference}`;
          ringCircle.style.strokeDashoffset = '0';
        }
      }
    } catch (err) {
      reportError(err, 'tick');
    }
  }

  // Initialization (v0.3.46 Part A2: fully protected by try/catch)
  try {
    const saved = localStorage.getItem('taio_clock_view_mode');
    if (saved === 'ring' || saved === 'bar') viewMode = saved;
  } catch {}
  setViewMode(viewMode);

  try {
    const saved3 = localStorage.getItem('taio_clock_three_view_mode');
    if (saved3 === 'remaining' || saved3 === 'elapsed' || saved3 === 'goal') {
      threeViewMode = saved3;
    } else {
      threeViewMode = 'remaining';
    }
  } catch {
    threeViewMode = 'remaining';
  }
  setThreeViewMode(threeViewMode);

  // Live timer tick every second (unconditionally started)
  setInterval(tick, 1000);

  // 1. Direct IPC listener for timer sync (reliable and instant)
  if (window.taioAPI && window.taioAPI.onSyncTimer) {
    try {
      window.taioAPI.onSyncTimer((data) => {
        window.updateUI(data);
      });
    } catch (err) {
      reportError(err, 'onSyncTimer setup');
    }
  }

  // 2. Active pull: immediately fetch current timer from main process
  if (window.taioAPI && window.taioAPI.getTimerData) {
    try {
      window.taioAPI.getTimerData().then((data) => {
        if (data) window.updateUI(data);
      }).catch((err) => {
        reportError(err, 'getTimerData');
      });
    } catch (err) {
      reportError(err, 'getTimerData setup');
    }
  }

  // 3. Notify main process that clock window is loaded and ready
  if (window.taioAPI && window.taioAPI.notifyClockReady) {
    try {
      window.taioAPI.notifyClockReady();
    } catch (err) {
      reportError(err, 'notifyClockReady');
    }
  }
})();
