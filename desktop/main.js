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

  quickNoteWindow = new BrowserWindow({
    width: 420,
    height: 180,
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

// PRD FIX v0.3.28 C2: Frameless Clock Window (⌥⌘T)
function createClockWindow() {
  if (clockWindow && !clockWindow.isDestroyed()) {
    clockWindow.show();
    clockWindow.focus();
    return;
  }

  const bounds = clockWindowBounds || { width: 240, height: 150 };

  clockWindow = new BrowserWindow({
    width: 240,
    height: 150,
    minWidth: 220,
    minHeight: 140,
    maxWidth: 320,
    maxHeight: 200,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    alwaysOnTop: clockIsPinned,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    show: false,
    transparent: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden',
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') },
  });

  const clockHTML = `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      background: #ffffff;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 14px 12px 14px;
      -webkit-app-region: drag;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 20px;
    }
    .actions-top {
      display: flex;
      align-items: center;
      gap: 6px;
      -webkit-app-region: no-drag;
    }
    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      color: #64748b;
      padding: 2px 4px;
      border-radius: 6px;
      line-height: 1;
    }
    .icon-btn:hover { background: #f1f5f9; color: #0f172a; }
    .icon-btn.active { color: #e0401f; font-weight: 700; }
    .task-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 2px 0;
      padding: 0 4px;
    }
    .timer-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 2px 0;
    }
    .time-digits {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', monospace;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .progress-track {
      width: 100%;
      height: 3px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .progress-fill {
      height: 100%;
      background: #e0401f;
      width: 100%;
      transition: width 1s linear;
    }
    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      -webkit-app-region: no-drag;
    }
    .btn {
      flex: 1;
      height: 26px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .btn.primary {
      background: #e0401f;
      color: #ffffff;
      border: none;
    }
    .btn.primary:hover { background: #c83618; }
  </style></head><body>
    <div class="header">
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">TAIO Clock</div>
      <div class="actions-top">
        <button id="pinBtn" class="icon-btn active" title="Ghim luôn nổi trên cùng">📌</button>
        <button class="icon-btn" onclick="window.close()" title="Đóng">&times;</button>
      </div>
    </div>

    <div class="task-title" id="title">Chưa có việc đang làm</div>

    <div class="timer-display">
      <div class="time-digits" id="digits">00:00</div>
    </div>

    <div class="progress-track">
      <div class="progress-fill" id="progress"></div>
    </div>

    <div class="bottom-bar">
      <button class="btn" id="btnExtend">+5p</button>
      <button class="btn primary" id="btnDone">✓ Xong</button>
    </div>

    <script>
      let endsAt = 0;
      let startedAt = 0;
      let isPinned = true;

      const titleEl = document.getElementById('title');
      const digitsEl = document.getElementById('digits');
      const progressEl = document.getElementById('progress');
      const pinBtn = document.getElementById('pinBtn');
      const btnExtend = document.getElementById('btnExtend');
      const btnDone = document.getElementById('btnDone');

      let mode = 'task';
      let subtitle = '';

      function updateUI(data) {
        if (!data) return;
        mode = data.mode || 'task';
        subtitle = data.subtitle || '';
        if (data.title) titleEl.innerText = data.title;
        if (data.endsAt) endsAt = data.endsAt;
        if (data.startedAt) startedAt = data.startedAt;

        const bottomBar = document.querySelector('.bottom-bar');
        const progressTrack = document.querySelector('.progress-track');

        if (mode === 'template_or_current') {
          titleEl.innerText = 'Hiện tại: ' + (data.title || '');
          digitsEl.innerText = subtitle || 'TAIO Time';
          digitsEl.style.fontSize = '15px';
          if (bottomBar) bottomBar.style.display = 'none';
          if (progressTrack) progressTrack.style.display = 'none';
        } else if (mode === 'gap') {
          titleEl.innerText = 'Trống (' + subtitle + ')';
          digitsEl.style.fontSize = '24px';
          if (bottomBar) bottomBar.style.display = 'none';
          if (progressTrack) progressTrack.style.display = 'block';
          tick();
        } else {
          digitsEl.style.fontSize = '24px';
          if (bottomBar) bottomBar.style.display = 'flex';
          if (progressTrack) progressTrack.style.display = 'block';
          tick();
        }
      }

      function tick() {
        if (mode === 'template_or_current') return;
        const now = Date.now();
        if (!endsAt || endsAt <= now) {
          digitsEl.innerText = '00:00';
          progressEl.style.width = '0%';
          return;
        }
        const diffSec = Math.max(0, Math.floor((endsAt - now) / 1000));
        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);
        const s = diffSec % 60;
        if (h > 0) {
          digitsEl.innerText = h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        } else {
          digitsEl.innerText = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        if (startedAt && endsAt > startedAt) {
          const pct = Math.max(0, Math.min(100, ((endsAt - now) / (endsAt - startedAt)) * 100));
          progressEl.style.width = pct + '%';
        }
      }

      setInterval(tick, 1000);

      // Listen for window state or timer sync
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'sync') updateUI(e.data.payload);
      });

      pinBtn.addEventListener('click', () => {
        isPinned = !isPinned;
        pinBtn.classList.toggle('active', isPinned);
        if (window.taioAPI && window.taioAPI.sendTimerAction) {
          window.taioAPI.sendTimerAction({ type: 'toggle-pin', pinned: isPinned });
        }
      });

      btnExtend.addEventListener('click', () => {
        if (window.taioAPI && window.taioAPI.sendTimerAction) {
          window.taioAPI.sendTimerAction({ type: 'extend', minutes: 5 });
        }
      });

      btnDone.addEventListener('click', () => {
        if (window.taioAPI && window.taioAPI.sendTimerAction) {
          window.taioAPI.sendTimerAction({ type: 'done' });
        }
      });
    </script>
  </body></html>`;

  clockWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(clockHTML));
  clockWindow.once('ready-to-show', () => {
    clockWindow.show();
    syncClockWindowData();
  });

  clockWindow.on('moved', () => {
    if (clockWindow) clockWindowBounds = clockWindow.getBounds();
  });
  clockWindow.on('closed', () => { clockWindow = null; });
}

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

function updateTrayMenu() {
  if (!tray) return;
  tray.setTitle(timerLabel === 'TAIO Time' ? '' : timerLabel);
  tray.setToolTip(timerLabel);
  const contextMenu = Menu.buildFromTemplate([
    { label: timerLabel, enabled: false },
    { type: 'separator' },
    { label: 'Ghi nhanh (⌥⌘N)', click: createQuickNoteWindow },
    { label: 'Đồng hồ rời (⌥⌘T)', click: createClockWindow },
    { label: 'Mở TAIO Time', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { type: 'separator' },
    { label: 'Thoát', click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
}

// IPC: receive timer updates from renderer (string or { title, endsAt, startedAt })
ipcMain.on('taio-timer-update', (_event, payload) => {
  if (typeof payload === 'string') {
    timerLabel = payload || 'TAIO Time';
  } else if (payload && typeof payload === 'object') {
    currentTimerData = { ...currentTimerData, ...payload };
    if (payload.title) {
      timerLabel = `${payload.title} · ${payload.remaining || ''}`.trim();
    }
    syncClockWindowData();
  }
  updateTrayMenu();
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
