// TAIO Time — macOS desktop shell (Electron) with mini tools (PRD B35.5 / v0.3.27 / FIX v0.3.28).
// Quick Note (⌥⌘N), Frameless Clock Window (⌥⌘T), Tray timer, keeps alive on macOS when main window closed.
const { app, BrowserWindow, protocol, shell, net, globalShortcut, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

const SCHEME = 'app';
const HOST = 'taio';
const WEB_DIR = fs.existsSync(path.join(__dirname, 'web'))
  ? path.join(__dirname, 'web')
  : path.resolve(__dirname, '../out');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

let mainWindow = null;
let quickNoteWindow = null;
let clockWindow = null;
let tray = null;
let timerLabel = 'TAIO Time';

// Remembered clock state
let currentTimerData = {
  title: 'Chưa có việc đang làm',
  endsAt: 0,
  startedAt: 0,
};
let clockWindowBounds = null;
let quickNoteWindowBounds = null;
let clockIsPinned = true;

function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(WEB_DIR, rel));
  if (!file.startsWith(WEB_DIR)) return path.join(WEB_DIR, '404.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) file = path.join(WEB_DIR, 'index.html');
  return file;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'TAIO Time',
    backgroundColor: '#ffffff',
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') },
  });
  mainWindow.loadURL(`${SCHEME}://${HOST}/index.html`);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`${SCHEME}://`)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('did-finish-load', () => {
    flushQuickNoteQueue();
  });
}

const quickNoteQueue = [];

function flushQuickNoteQueue() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.webContents) return;
  while (quickNoteQueue.length > 0) {
    const note = quickNoteQueue.shift();
    mainWindow.webContents.send('taio-quick-note-received', note);
  }
}

// B35.5: Floating Quick Note window (⌥⌘N)
function createQuickNoteWindow() {
  if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
    quickNoteWindow.show();
    quickNoteWindow.focus();
    return;
  }

  const bounds = quickNoteWindowBounds || { width: 420, height: 180 };

  quickNoteWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 300,
    minHeight: 120,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden',
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') },
  });

  quickNoteWindow.on('resize', () => {
    if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
      quickNoteWindowBounds = quickNoteWindow.getBounds();
    }
  });
  quickNoteWindow.on('move', () => {
    if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
      quickNoteWindowBounds = quickNoteWindow.getBounds();
    }
  });

  const quickNoteHTML = `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; padding: 16px; -webkit-app-region: drag; }
    input { -webkit-app-region: no-drag; width: 100%; height: 44px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 14px;
      font-size: 14px; outline: none; background: #f8fafc; }
    input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .hint { font-size: 11px; color: #94a3b8; margin-top: 8px; text-align: center; }
    .title { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .close { -webkit-app-region: no-drag; position: absolute; top: 8px; right: 12px; background: none; border: none;
      font-size: 16px; color: #94a3b8; cursor: pointer; line-height: 1; }
    .close:hover { color: #475569; }
  </style></head><body>
    <button class="close" onclick="window.close()">&times;</button>
    <div class="title">✍️ Ghi nhanh TAIO</div>
    <input id="note" placeholder="21:30 gọi anh Minh..." autofocus />
    <div class="hint">⌥⌘N · Enter để lưu, Esc để đóng</div>
    <script>
      const input = document.getElementById('note');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          if (window.taioAPI) window.taioAPI.sendQuickNote(input.value.trim());
          input.value = '';
          window.close();
        }
        if (e.key === 'Escape') window.close();
      });
    </script>
  </body></html>`;

  quickNoteWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(quickNoteHTML));
  quickNoteWindow.once('ready-to-show', () => {
    quickNoteWindow.show();
    quickNoteWindow.focus();
  });
  quickNoteWindow.on('closed', () => { quickNoteWindow = null; });
}

// PRD FIX v0.3.33 Part I: Frameless Dual-View Floating Clock (⌥⌘T)
function createClockWindow() {
  if (clockWindow && !clockWindow.isDestroyed()) {
    clockWindow.show();
    clockWindow.focus();
    return;
  }

  const bounds = clockWindowBounds || { width: 260, height: 140 };

  clockWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 180,
    minHeight: 110,
    maxWidth: 420,
    maxHeight: 420,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    alwaysOnTop: clockIsPinned,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    show: false,
    transparent: false,
    backgroundColor: "#ffffff",
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js") },
  });

  // macOS: hide traffic lights to prevent covering app buttons and title (Part I1.1 / I2.1)
  if (process.platform === "darwin" && typeof clockWindow.setWindowButtonVisibility === "function") {
    clockWindow.setWindowButtonVisibility(false);
  }

  clockWindow.on("resize", () => {
    if (clockWindow && !clockWindow.isDestroyed()) {
      clockWindowBounds = clockWindow.getBounds();
    }
  });
  clockWindow.on("move", () => {
    if (clockWindow && !clockWindow.isDestroyed()) {
      clockWindowBounds = clockWindow.getBounds();
    }
  });

  // Load external clean HTML file (Part I2.5)
  clockWindow.loadFile(path.join(__dirname, "clock/clock.html"));

  clockWindow.once("ready-to-show", () => {
    clockWindow.show();
    syncClockWindowData();
  });

  clockWindow.on("closed", () => { clockWindow = null; });
}

ipcMain.on("taio-open-today-journal", (_event, taskId) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("taio-open-today-journal", taskId);
  } else {
    createQuickNoteWindow();
  }
});

function syncClockWindowData() {
  if (!clockWindow || clockWindow.isDestroyed() || !clockWindow.webContents) return;
  clockWindow.webContents.executeJavaScript(
    `if (typeof updateUI === 'function') updateUI(${JSON.stringify(currentTimerData)});`
  );
}

// B35.5: Tray with timer display
function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkoBAwUqifYdQABhpEAyM2L4wiA8YQYMA3DEYDEUMSMBIMBAYaJCSqAQAL6QYRdpSxJAAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon);
  updateTrayMenu();
}

let currentLang = 'vi';

function updateTrayMenu() {
  if (!tray) return;
  tray.setTitle(timerLabel === 'TAIO Time' ? '' : timerLabel);
  tray.setToolTip(timerLabel);
  const isEn = currentLang === 'en';
  const contextMenu = Menu.buildFromTemplate([
    { label: timerLabel, enabled: false },
    { type: 'separator' },
    { label: isEn ? 'Quick Note (⌥⌘N)' : 'Ghi nhanh (⌥⌘N)', click: createQuickNoteWindow },
    { label: isEn ? 'Floating Clock (⌥⌘T)' : 'Đồng hồ rời (⌥⌘T)', click: createClockWindow },
    { label: isEn ? 'Open TAIO Time' : 'Mở TAIO Time', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { type: 'separator' },
    { label: isEn ? 'Quit' : 'Thoát', click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
}

// IPC: receive timer updates from renderer (string or { title, endsAt, startedAt, lang })
ipcMain.on('taio-timer-update', (_event, payload) => {
  if (typeof payload === 'string') {
    timerLabel = payload || 'TAIO Time';
  } else if (payload && typeof payload === 'object') {
    currentTimerData = { ...currentTimerData, ...payload };
    if (payload.lang) {
      currentLang = payload.lang;
    }
    if (payload.title) {
      timerLabel = `${payload.title} · ${payload.remaining || ''}`.trim();
    }
    syncClockWindowData();
  }
  updateTrayMenu();
});

ipcMain.on('taio-lang-update', (_event, lang) => {
  if (lang) {
    currentLang = lang;
    updateTrayMenu();
  }
});

// IPC: open clock window
ipcMain.on('taio-open-clock', () => {
  createClockWindow();
});

// IPC: timer actions from clock window (done, extend, pin)
ipcMain.on('taio-timer-action', (_event, action) => {
  if (action && action.type === 'toggle-pin') {
    clockIsPinned = !!action.pinned;
    if (clockWindow && !clockWindow.isDestroyed()) {
      clockWindow.setAlwaysOnTop(clockIsPinned);
    }
    return;
  }
  // Forward action to main window
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('taio-timer-action', action);
  }
});

// IPC: receive quick note (FIX v0.3.28 A2: queue if main window closed)
ipcMain.on('taio-quick-note', (_event, noteText) => {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('taio-quick-note-received', noteText);
  } else {
    quickNoteQueue.push(noteText);
  }
});

app.whenReady().then(() => {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    return net.fetch(pathToFileURL(resolveFile(pathname)).toString());
  });

  createWindow();
  createTray();

  // Register global shortcuts: ⌥⌘N for Quick Note, ⌥⌘T for Clock
  globalShortcut.register('Alt+CommandOrControl+N', createQuickNoteWindow);
  globalShortcut.register('Alt+CommandOrControl+T', createClockWindow);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  // macOS: keep app alive for tray + global shortcuts
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
