// TAIO Time — Electron preload (PRD v0.3.33 Part I)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taioAPI', {
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
});
