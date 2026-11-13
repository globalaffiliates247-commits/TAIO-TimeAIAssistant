// TAIO Time — Electron preload (PRD B35.5 / v0.3.27 / v0.3.28)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taioAPI', {
  sendQuickNote: (text) => ipcRenderer.send('taio-quick-note', text),
  updateTimer: (data) => ipcRenderer.send('taio-timer-update', data),
  openClockWindow: () => ipcRenderer.send('taio-open-clock'),
  sendTimerAction: (action) => ipcRenderer.send('taio-timer-action', action),
  onQuickNoteReceived: (callback) => ipcRenderer.on('taio-quick-note-received', (_event, text) => callback(text)),
  onTimerAction: (callback) => ipcRenderer.on('taio-timer-action', (_event, action) => callback(action)),
});
