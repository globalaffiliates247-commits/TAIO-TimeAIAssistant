// TAIO Time — Electron preload (PRD B35.5 / v0.3.27)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taioAPI', {
  sendQuickNote: (text) => ipcRenderer.send('taio-quick-note', text),
  updateTimer: (remaining) => ipcRenderer.send('taio-timer-update', remaining),
  onQuickNoteReceived: (callback) => ipcRenderer.on('taio-quick-note-received', (_event, text) => callback(text)),
});
