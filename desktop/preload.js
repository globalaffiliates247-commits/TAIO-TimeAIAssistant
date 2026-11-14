// TAIO Time — Electron preload (PRD v0.3.33 Part I)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taioAPI', {
  sendQuickNote: (text) => ipcRenderer.send('taio-quick-note', text),
  updateTimer: (data) => ipcRenderer.send('taio-timer-update', data),
  openClockWindow: () => ipcRenderer.send('taio-open-clock'),
  openTodayJournal: (taskId) => ipcRenderer.send('taio-open-today-journal', taskId),
  sendTimerAction: (action) => ipcRenderer.send('taio-timer-action', action),
  onQuickNoteReceived: (callback) => ipcRenderer.on('taio-quick-note-received', (_event, text) => callback(text)),
  onTimerAction: (callback) => ipcRenderer.on('taio-timer-action', (_event, action) => callback(action)),
  onOpenTodayJournal: (callback) => ipcRenderer.on('taio-open-today-journal', (_event, taskId) => callback(taskId)),
});
