// TAIO Time — Unified Electron Preload Bridge (PRD v0.3.51 Part B)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taioAPI', {
  // Generic Window Management API (Part B1)
  window: {
    open: (id) => ipcRenderer.send('taio-window-open', id),
    close: (id) => ipcRenderer.send('taio-window-close', id),
    toggle: (id) => ipcRenderer.send('taio-window-toggle', id),
    pin: (id, isPinned) => ipcRenderer.send('taio-window-pin', { id, isPinned }),
    setHeight: (id, height) => ipcRenderer.send('taio-window-set-height', { id, height }),
  },

  // Generic Data Bridge (Part B1 & B2)
  data: {
    get: (collection, query) => ipcRenderer.invoke('taio-data-get', collection, query),
    subscribe: (collection, callback) => {
      const channel = `taio-data-sync:${collection}`;
      const listener = (_event, data) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    act: (collection, action, payload) => ipcRenderer.send('taio-data-act', { collection, action, payload }),
    onAct: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('taio-data-act', listener);
      return () => ipcRenderer.removeListener('taio-data-act', listener);
    },
  },

  // Language Bridge (Part B1 & F)
  lang: {
    get: () => ipcRenderer.invoke('taio-lang-get'),
    subscribe: (callback) => {
      const listener = (_event, lang) => callback(lang);
      ipcRenderer.on('taio-lang-update', listener);
      return () => ipcRenderer.removeListener('taio-lang-update', listener);
    },
  },

  // --- Legacy Compatibility Layer (PRD v0.3.51 Part B4) ---
  // Note: These methods are maintained for backward-compatibility with older components
  // and will be deprecated in future versions in favor of taioAPI.window / taioAPI.data.
  sendQuickNote: (text) => ipcRenderer.send('taio-quick-note', text),
  updateTimer: (data) => ipcRenderer.send('taio-timer-update', data),
  openClockWindow: () => ipcRenderer.send('taio-open-clock'),
  bringToFront: () => ipcRenderer.send('taio-bring-to-front'),
  openTodayJournal: (taskId) => ipcRenderer.send('taio-open-today-journal', taskId),
  sendTimerAction: (action) => ipcRenderer.send('taio-timer-action', action),
  notifyClockReady: () => ipcRenderer.send('taio-clock-ready'),
  sendClockError: (err) => ipcRenderer.send('taio-clock-error', err),
  getTimerData: () => ipcRenderer.invoke('taio-get-timer'),
  onClockError: (callback) => {
    const listener = (_event, err) => callback(err);
    ipcRenderer.on('taio-clock-error', listener);
    return () => ipcRenderer.removeListener('taio-clock-error', listener);
  },
  onQuickNoteReceived: (callback) => {
    const listener = (_event, text) => callback(text);
    ipcRenderer.on('taio-quick-note-received', listener);
    return () => ipcRenderer.removeListener('taio-quick-note-received', listener);
  },
  onTimerAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('taio-timer-action', listener);
    return () => ipcRenderer.removeListener('taio-timer-action', listener);
  },
  onOpenTodayJournal: (callback) => {
    const listener = (_event, taskId) => callback(taskId);
    ipcRenderer.on('taio-open-today-journal', listener);
    return () => ipcRenderer.removeListener('taio-open-today-journal', listener);
  },
  onSyncTimer: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('taio-sync-timer', listener);
    return () => ipcRenderer.removeListener('taio-sync-timer', listener);
  },
  openDaySheetWindow: () => ipcRenderer.send('taio-open-day-sheet-window'),
  setAutoMinimizeClock: (val) => ipcRenderer.send('taio-set-auto-minimize-clock', val),
  onDaySheetOpened: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('taio-day-sheet-opened', listener);
    return () => ipcRenderer.removeListener('taio-day-sheet-opened', listener);
  },
  onDaySheetClosed: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('taio-day-sheet-closed', listener);
    return () => ipcRenderer.removeListener('taio-day-sheet-closed', listener);
  },
});
