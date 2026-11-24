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

  // Vietnam Lunar Calendar algorithm (Ho Ngoc Duc, UTC+7)
  function jdFromDate(dd, mm, yy) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) {
      jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }
    return jd;
  }

  function getNewMoonDay(k, timeZone) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = Math.PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    const C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    const C2 = -0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
    const C3 = -0.0004 * Math.sin(3 * dr * Mpr);
    const C4 = 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
    const C5 = -0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
    const C6 = -0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
    const C7 = 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
    const Jd = Jd1 + C1 + C2 + C3 + C4 + C5 + C6 + C7;
    return Math.floor(Jd + 0.5 + timeZone / 24);
  }

  function getSunLongitude(jdn, timeZone) {
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const dr = Math.PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T * T - 0.00000048 * T * T * T;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T * T;
    const DL = (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(dr * M) +
      (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
      0.00029 * Math.sin(dr * 3 * M);
    let L = L0 + DL;
    L = L * dr;
    L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
    return Math.floor((L / Math.PI) * 6);
  }

  function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
  }

  function getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function calculateLunarDate(dd, mm, yy) {
    const timeZone = 7;
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = getNewMoonDay(k, timeZone);
    }
    let a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);
    let lunarLeap = false;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = true;
        }
      }
    }
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }
    return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: lunarLeap };
  }

  // Elements
  const lblTitle = document.getElementById('lblTitle');
  const btnPin = document.getElementById('btnPin');
  const btnClose = document.getElementById('btnClose');
  const lblSolarDate = document.getElementById('lblSolarDate');
  const lblDayOfWeek = document.getElementById('lblDayOfWeek');
  const lblLunarDate = document.getElementById('lblLunarDate');
  const eventsList = document.getElementById('eventsList');
  const emptyState = document.getElementById('emptyState');
  const lblEmpty = document.getElementById('lblEmpty');
  const btnEmptyCta = document.getElementById('btnEmptyCta');
  const formAdd = document.getElementById('formAdd');
  const inputEvent = document.getElementById('inputEvent');
  const btnAdd = document.getElementById('btnAdd');

  let currentLang = 'vi';
  let i18n = {};
  let isPinned = false;
  let allEvents = [];

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
    lblTitle.textContent = t('title', 'Sự kiện hôm nay');
    lblEmpty.textContent = t('empty', 'Hôm nay chưa có sự kiện nào');
    btnEmptyCta.textContent = t('emptyCta', '+ Thêm sự kiện mới');
    inputEvent.placeholder = t('addPlaceholder', '14:00 Họp dự án...');
    btnAdd.textContent = t('addBtn', 'Thêm');
    btnPin.title = isPinned ? t('unpin', 'Bỏ ghim') : t('pin', 'Ghim lên trên');
    btnClose.title = t('close', 'Đóng');
    renderDate();
    renderEvents();
  }

  function renderDate() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dayOfWeekIdx = now.getDay();

    const viDays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    lblSolarDate.textContent = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    lblDayOfWeek.textContent = currentLang === 'en' ? enDays[dayOfWeekIdx] : viDays[dayOfWeekIdx];

    const lunar = calculateLunarDate(day, month, year);
    if (lunar) {
      const leapSuffix = lunar.isLeap ? (currentLang === 'en' ? ' (Leap)' : ' (Nhuận)') : '';
      const lunarLabel = t('lunarLabel', 'Âm lịch');
      lblLunarDate.textContent = `${lunarLabel}: ${lunar.day}/${lunar.month}${leapSuffix}`;
    }
  }

  function getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isPastTime(timeStr) {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const eventMins = h * 60 + (m || 0);
    return eventMins < currentMins;
  }

  function renderEvents() {
    const todayIso = getTodayIso();
    const todayEvents = (allEvents || []).filter(e => {
      if (!e) return false;
      if (e.date === todayIso) return true;
      if (e.recurrence && e.recurrence !== 'none') {
        return true; // Simplified: matches recurring events
      }
      return false;
    });

    // Sort by startTime
    todayEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    if (todayEvents.length === 0) {
      eventsList.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    eventsList.innerHTML = todayEvents.map(e => {
      const pastClass = isPastTime(e.endTime || e.startTime) ? 'event-past' : '';
      const timeDisplay = e.startTime ? (e.endTime ? `${e.startTime} - ${e.endTime}` : e.startTime) : '--:--';
      const hasAlarm = e.alarm !== false;
      const alarmIcon = hasAlarm ? '🔔' : '🔕';
      const alarmTitle = hasAlarm ? t('alarmOn', 'Có chuông') : t('alarmOff', 'Tắt chuông');
      const safeTitle = escapeHtml(e.title || 'Untitled');
      const safeId = escapeHtml(e.id || '');

      return `
        <div class="event-card ${pastClass}" data-id="${safeId}">
          <div class="event-left">
            <span class="event-time">${escapeHtml(timeDisplay)}</span>
            <span class="event-title">${safeTitle}</span>
          </div>
          <div class="event-actions">
            <span class="alarm-indicator" title="${escapeHtml(alarmTitle)}" data-action="alarm" data-id="${safeId}">${alarmIcon}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Delegated event click
  eventsList.addEventListener('click', (e) => {
    const target = e.target;
    const alarmBtn = target.closest('[data-action="alarm"]');
    if (alarmBtn) {
      e.stopPropagation();
      const id = alarmBtn.getAttribute('data-id');
      if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
        window.taioAPI.data.act('scheduledEvents', 'toggleAlarm', { id });
      }
      return;
    }

    const card = target.closest('.event-card');
    if (card) {
      if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
        window.taioAPI.data.act('scheduledEvents', 'openInApp', { view: 'events-list', filter: 'all' });
      }
      if (window.taioAPI && window.taioAPI.window && typeof window.taioAPI.window.open === 'function') {
        window.taioAPI.window.open('main');
      }
    }
  });

  // Pin toggle
  btnPin.addEventListener('click', () => {
    isPinned = !isPinned;
    btnPin.classList.toggle('active', isPinned);
    btnPin.title = isPinned ? t('unpin', 'Bỏ ghim') : t('pin', 'Ghim lên trên');
    if (window.taioAPI && window.taioAPI.window && typeof window.taioAPI.window.pin === 'function') {
      window.taioAPI.window.pin('today-events', isPinned);
    }
  });

  // Close window
  btnClose.addEventListener('click', () => {
    window.close();
  });

  // Empty state CTA focus
  btnEmptyCta.addEventListener('click', () => {
    inputEvent.focus();
  });

  // Quick add form
  formAdd.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = inputEvent.value.trim();
    if (!val) return;

    let time = '';
    let title = val;
    const timeMatch = val.match(/^(\d{1,2}:\d{2})\s*(.*)$/);
    if (timeMatch) {
      time = timeMatch[1];
      title = timeMatch[2].trim() || 'Sự kiện';
    }

    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      date: getTodayIso(),
      startTime: time || undefined,
      alarm: true,
      createdAt: new Date().toISOString()
    };

    if (window.taioAPI && window.taioAPI.data && typeof window.taioAPI.data.act === 'function') {
      window.taioAPI.data.act('scheduledEvents', 'create', newEvent);
    }

    inputEvent.value = '';
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
      const data = await window.taioAPI.data.get('scheduledEvents');
      if (Array.isArray(data)) {
        allEvents = data;
        renderEvents();
      }
      if (typeof window.taioAPI.data.subscribe === 'function') {
        window.taioAPI.data.subscribe('scheduledEvents', (events) => {
          if (Array.isArray(events)) {
            allEvents = events;
            renderEvents();
          }
        });
      }
    }

    // Refresh time status every minute
    setInterval(() => {
      renderDate();
      renderEvents();
    }, 60000);
  }

  init();
})();
