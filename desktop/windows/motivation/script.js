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
  const btnPinWindow = document.getElementById('btnPinWindow');
  const btnClose = document.getElementById('btnClose');
  const avatarBox = document.getElementById('avatarBox');
  const avatarInitial = document.getElementById('avatarInitial');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const btnRefresh = document.getElementById('btnRefresh');
  const lblRefresh = document.getElementById('lblRefresh');
  const btnPinQuote = document.getElementById('btnPinQuote');
  const lblPinQuote = document.getElementById('lblPinQuote');
  const btnHeartQuote = document.getElementById('btnHeartQuote');
  const lblHeartQuote = document.getElementById('lblHeartQuote');

  let currentLang = 'vi';
  let i18n = {};
  let isWindowPinned = true;
  let currentQuote = null;

  async function loadTranslations(lang) {
    try {
      const res = await fetch(`lang.${lang}.json`);
      if (res.ok) {
        i18n = await res.json();
        return;
      }
    } catch {}
    try {
      const resEn = await fetch('lang.en.json');
      if (resEn.ok) {
        i18n = await resEn.json();
        return;
      }
    } catch {}
    try {
      const resVi = await fetch('lang.vi.json');
      if (resVi.ok) {
        i18n = await resVi.json();
      }
    } catch {}
  }

  function t(key, fallback) {
    return i18n[key] || fallback || key;
  }

  function updateTexts() {
    lblTitle.textContent = t('title', 'Câu động lực');
    lblRefresh.textContent = t('refresh', 'Đổi câu khác');
    btnRefresh.title = t('refresh', 'Đổi câu khác');
    btnPinWindow.title = isWindowPinned ? t('unpin', 'Bỏ ghim') : t('pin', 'Ghim lên trên');
    btnClose.title = t('close', 'Đóng');

    updateQuoteUI();
  }

  function updateQuoteUI() {
    if (!currentQuote || !currentQuote.text) {
      quoteText.textContent = '';
      quoteAuthor.textContent = '';
      avatarInitial.textContent = 'T';
      btnPinQuote.classList.remove('active');
      btnHeartQuote.classList.remove('active');
      lblPinQuote.textContent = t('pin', 'Ghim');
      lblHeartQuote.textContent = t('heart', 'Tim');
      return;
    }

    const text = currentLang === 'en' && currentQuote.textEn ? currentQuote.textEn : currentQuote.text;
    quoteText.textContent = `“${text}”`;
    quoteAuthor.textContent = currentQuote.author ? `— ${currentQuote.author}` : '';

    if (currentQuote.authorAvatar) {
      avatarBox.innerHTML = `<img src="${escapeHtml(currentQuote.authorAvatar)}" alt="${escapeHtml(currentQuote.author || '')}">`;
    } else {
      const initial = currentQuote.author ? currentQuote.author.trim().charAt(0).toUpperCase() : 'T';
      avatarBox.innerHTML = `<span id="avatarInitial">${escapeHtml(initial)}</span>`;
    }

    const isQuotePinned = !!currentQuote.pinned;
    btnPinQuote.classList.toggle('active', isQuotePinned);
    lblPinQuote.textContent = isQuotePinned ? t('unpin', 'Bỏ ghim') : t('pin', 'Ghim');

    const isHearted = !!currentQuote.hearted;
    btnHeartQuote.classList.toggle('active', isHearted);
    lblHeartQuote.textContent = isHearted ? t('unheart', 'Bỏ tim') : t('heart', 'Tim');
  }

  // Window Pin Toggle
  btnPinWindow.addEventListener('click', () => {
    isWindowPinned = !isWindowPinned;
    btnPinWindow.classList.toggle('active', isWindowPinned);
    btnPinWindow.title = isWindowPinned ? t('unpin', 'Bỏ ghim') : t('pin', 'Ghim lên trên');
    if (window.taioAPI && window.taioAPI.window && typeof window.taioAPI.window.pin === 'function') {
      window.taioAPI.window.pin('motivation', isWindowPinned);
    }
  });

  // Close
  btnClose.addEventListener('click', () => {
    window.close();
  });

  // Refresh Quote
  btnRefresh.addEventListener('click', () => {
    if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
      window.taioAPI.data.act('motivationQuote', 'refresh', { instanceKey: 'desktop_window' });
    }
  });

  // Pin Quote
  btnPinQuote.addEventListener('click', () => {
    if (!currentQuote) return;
    const quoteId = currentQuote.id;
    const nextPinned = !currentQuote.pinned;
    currentQuote.pinned = nextPinned;
    updateQuoteUI();
    if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
      window.taioAPI.data.act('motivationQuote', 'pin', { quoteId, pinned: nextPinned, instanceKey: 'desktop_window' });
    }
  });

  // Heart Quote
  btnHeartQuote.addEventListener('click', () => {
    if (!currentQuote) return;
    const quoteId = currentQuote.id;
    const nextHearted = !currentQuote.hearted;
    currentQuote.hearted = nextHearted;
    updateQuoteUI();
    if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
      window.taioAPI.data.act('motivationQuote', 'react', { quoteId, reaction: 'heart', value: nextHearted, instanceKey: 'desktop_window' });
    }
  });

  // Init
  async function init() {
    if (window.taioAPI && window.taioAPI.lang && typeof window.taioAPI.lang.get === 'function') {
      currentLang = (await window.taioAPI.lang.get()) || 'vi';
      if (typeof window.taioAPI.lang.subscribe === 'function') {
        window.taioAPI.lang.subscribe((lang) => {
          currentLang = lang || 'vi';
          loadTranslations(currentLang).then(updateTexts);
        });
      }
    }
    await loadTranslations(currentLang);
    updateTexts();

    if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.get === 'function') {
      const quote = await window.taioAPI.data.get('motivationQuote', { instanceKey: 'desktop_window' });
      if (quote) {
        currentQuote = quote;
        updateQuoteUI();
      }
      if (typeof window.taioAPI.data.subscribe === 'function') {
        window.taioAPI.data.subscribe('motivationQuote', (quote) => {
          if (quote) {
            currentQuote = quote;
            updateQuoteUI();
          }
        });
      }
    }
  }

  init();
})();
