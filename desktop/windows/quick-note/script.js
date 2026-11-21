(function() {
  const input = document.getElementById('noteInput');
  const btnClose = document.getElementById('btnClose');
  const titleText = document.getElementById('titleText');
  const hintText = document.getElementById('hintText');

  let currentLang = 'vi';
  let i18n = {};

  async function loadTranslations(lang) {
    try {
      const res = await fetch(`lang.${lang}.json`);
      if (res.ok) {
        return await res.json();
      }
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
    if (i18n.title) titleText.textContent = `✍️ ${i18n.title}`;
    if (i18n.placeholder) input.placeholder = i18n.placeholder;
    if (i18n.hint) hintText.textContent = i18n.hint;
  }

  async function setLanguage(lang) {
    currentLang = lang || 'vi';
    i18n = await loadTranslations(currentLang);
    applyTranslations();
  }

  if (window.taioAPI && window.taioAPI.lang) {
    window.taioAPI.lang.get().then(setLanguage);
    window.taioAPI.lang.subscribe(setLanguage);
  } else {
    setLanguage('vi');
  }

  btnClose.addEventListener('click', () => {
    window.close();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const val = input.value.trim();
      if (window.taioAPI) {
        if (typeof window.taioAPI.data?.act === 'function') {
          window.taioAPI.data.act('quickNotes', 'create', { text: val });
        } else if (typeof window.taioAPI.sendQuickNote === 'function') {
          window.taioAPI.sendQuickNote(val);
        }
      }
      input.value = '';
      window.close();
    }
    if (e.key === 'Escape') {
      window.close();
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    input.focus();
  });
})();
