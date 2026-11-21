(function() {
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const lblTitle = document.getElementById('lblTitle');
  const btnPin = document.getElementById('btnPin');
  const btnClose = document.getElementById('btnClose');
  const timersList = document.getElementById('timersList');
  const emptyState = document.getElementById('emptyState');
  const emptyMsg = document.getElementById('emptyMsg');
  const emptyHintMsg = document.getElementById('emptyHintMsg');
  const formAdd = document.getElementById('formAdd');
  const inputTitle = document.getElementById('inputTitle');
  const selectMins = document.getElementById('selectMins');
  const btnStart = document.getElementById('btnStart');

  let currentLang = 'vi';
  let i18n = {};
  let isPinned = true;
  let activeTimers = [];

  async function loadTranslations(lang) {
    try {
      const res = await fetch(`lang.${lang}.json`);
      if (res.ok) return await res.json();
    } catch (e) {}
    try {
      const resEn = await fetch('lang.en.json');
      if (resEn.ok) return await resEn.json();
    } catch (e) {}
    try {
      const resVi = await fetch('lang.vi.json');
      if (resVi.ok) return await resVi.json();
    } catch (e) {}
    return {};
  }

  function applyTranslations() {
    if (i18n.title) lblTitle.textContent = i18n.title;
    if (i18n.empty) emptyMsg.textContent = i18n.empty;
    if (i18n.emptyHint) emptyHintMsg.textContent = i18n.emptyHint;
    if (i18n.placeholder) inputTitle.placeholder = i18n.placeholder;
    if (i18n.start) btnStart.textContent = i18n.start;
    if (i18n.pinTitle) btnPin.title = i18n.pinTitle;
    if (i18n.closeTitle) btnClose.title = i18n.closeTitle;
    renderTimers();
  }

  async function setLanguage(lang) {
    currentLang = lang || 'vi';
    i18n = await loadTranslations(currentLang);
    applyTranslations();
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    const hh = Math.floor(m / 60);
    const remM = m % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hh > 0) {
      return `${hh}:${pad(remM)}:${pad(remS)}`;
    }
    return `${pad(remM)}:${pad(remS)}`;
  }

  function renderTimers() {
    if (!activeTimers || activeTimers.length === 0) {
      timersList.innerHTML = '';
      timersList.appendChild(emptyState);
      emptyState.style.display = 'flex';
      btnStart.disabled = false;
      return;
    }

    emptyState.style.display = 'none';
    const isLimit = activeTimers.length >= 3;
    btnStart.disabled = isLimit;
    if (isLimit) {
      btnStart.title = i18n.maxLimit || 'Tối đa 3 đồng hồ cùng lúc';
    } else {
      btnStart.title = '';
    }

    const now = Date.now();
    timersList.innerHTML = activeTimers.map(t => {
      const safeTitle = escapeHtml(t.title || 'Timer');
      const safeId = escapeHtml(t.id);
      let timeStr = '--:--';

      if (t.endsAt && t.endsAt > 0) {
        const remSec = Math.max(0, (t.endsAt - now) / 1000);
        timeStr = formatTime(remSec);
      } else if (t.startedAt && t.startedAt > 0) {
        const elapSec = Math.max(0, (now - t.startedAt) / 1000);
        timeStr = formatTime(elapSec);
      } else if (t.timeStr) {
        timeStr = escapeHtml(t.timeStr);
      }

      return `
        <div class="timer-card" data-id="${safeId}">
          <div class="timer-info">
            <div class="timer-name" title="${safeTitle}">${safeTitle}</div>
            <div class="timer-digits">${timeStr}</div>
          </div>
          <div class="timer-btns">
            <button class="btn btn-stop" data-action="stop" data-id="${safeId}">${escapeHtml(i18n.stop || 'Dừng')}</button>
            <button class="btn btn-done" data-action="done" data-id="${safeId}">${escapeHtml(i18n.done || 'Xong')}</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Delegated events for stop and done
  timersList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (!id) return;

    if (window.taioAPI?.data?.act) {
      window.taioAPI.data.act('freeTimers', action, { id });
    } else if (window.taioAPI?.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: action === 'stop' ? 'stop-free-timer' : 'finish-free-timer', timerId: id });
    }
  });

  // Pin button
  btnPin.addEventListener('click', () => {
    isPinned = !isPinned;
    btnPin.classList.toggle('active', isPinned);
    if (window.taioAPI?.window?.pin) {
      window.taioAPI.window.pin('free-timers', isPinned);
    }
  });

  // Close button
  btnClose.addEventListener('click', () => {
    if (window.taioAPI?.window?.close) {
      window.taioAPI.window.close('free-timers');
    } else {
      window.close();
    }
  });

  // Quick add form
  formAdd.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = inputTitle.value.trim();
    const minutes = parseInt(selectMins.value, 10) || 15;
    if (!title) return;

    if (activeTimers.length >= 3) {
      alert(i18n.maxLimit || 'Tối đa 3 đồng hồ cùng lúc');
      return;
    }

    if (window.taioAPI?.data?.act) {
      window.taioAPI.data.act('freeTimers', 'start', { title, minutes });
    } else if (window.taioAPI?.sendTimerAction) {
      window.taioAPI.sendTimerAction({ type: 'start-free-timer', title, minutes });
    }

    inputTitle.value = '';
  });

  // Update loop for ticks
  setInterval(() => {
    if (activeTimers.length > 0) {
      renderTimers();
    }
  }, 1000);

  // Data connection
  function onDataUpdate(data) {
    if (Array.isArray(data)) {
      activeTimers = data;
    } else if (data && Array.isArray(data.freeTimers)) {
      activeTimers = data.freeTimers;
    } else {
      activeTimers = [];
    }
    renderTimers();
  }

  if (window.taioAPI?.data?.subscribe) {
    window.taioAPI.data.subscribe('freeTimers', onDataUpdate);
    window.taioAPI.data.get('freeTimers').then(onDataUpdate);
  }

  if (window.taioAPI?.lang) {
    window.taioAPI.lang.get().then(setLanguage);
    window.taioAPI.lang.subscribe(setLanguage);
  } else {
    setLanguage('vi');
  }
})();
