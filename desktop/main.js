// TAIO Time — Modular Desktop Shell (Electron) with Window Registry (PRD v0.3.51)
const { app, BrowserWindow, protocol, shell, net, globalShortcut, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const { spawn } = require('child_process');

const SCHEME = 'app';
const HOST = 'taio';
const WEB_DIR = fs.existsSync(path.join(__dirname, 'web'))
  ? path.join(__dirname, 'web')
  : path.resolve(__dirname, '../out');

const WINDOWS_DIR = fs.existsSync(path.join(__dirname, 'windows'))
  ? path.join(__dirname, 'windows')
  : path.resolve(__dirname, 'windows');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

let mainWindow = null;
let tray = null;
let timerLabel = 'TAIO Time';
let isQuitting = false;
let autoMinimizeOnClock = true;
let currentLang = 'vi';

// Registry & Active Windows
const windowRegistry = new Map();
const activeWindows = new Map();
const failedShortcuts = [];
const boundsSaveTimeouts = new Map();

// Remembered clock/timer state
let currentTimerData = {
  title: 'Trống',
  subtitle: 'Chưa có việc đang làm',
  mode: 'gap',
  endsAt: 0,
  startedAt: 0,
  lang: 'vi',
};

// --- Mac Frontmost App & Multi-Window Focus Telemetry (PRD v0.3.54 Part C) ---
let latestFrontApp = { appName: '', bundleId: '' };
let frontAppProcess = null;
let focusDebounceTimer = null;
let taioIsFocused = true;
let taioLeaveTimestamp = null;

function initFrontAppObserver() {
  if (process.platform !== 'darwin') return;
  const binCandidates = [
    path.join(__dirname, 'native/frontApp/frontApp'),
    path.resolve(__dirname, 'native/frontApp/frontApp'),
    path.join(process.resourcesPath || '', 'app/native/frontApp/frontApp'),
  ];
  const binPath = binCandidates.find(p => fs.existsSync(p));
  if (!binPath) {
    console.warn('[main] FrontApp observer binary not found in candidates');
    return;
  }

  try {
    frontAppProcess = spawn(binPath, [], { stdio: ['ignore', 'pipe', 'ignore'] });
    let buffer = '';
    frontAppProcess.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed && typeof parsed.appName === 'string') {
            latestFrontApp = {
              appName: parsed.appName || '',
              bundleId: parsed.bundleId || '',
            };
            broadcastDataSync('frontApp', latestFrontApp);
          }
        } catch (_) {}
      }
    });

    frontAppProcess.on('exit', () => {
      frontAppProcess = null;
    });
  } catch (err) {
    console.error('[main] Failed to spawn frontApp observer:', err);
  }
}

function evaluateTaioFocus() {
  const focusedWin = BrowserWindow.getFocusedWindow();
  const hasFocus = Boolean(focusedWin);

  if (!hasFocus && taioIsFocused) {
    taioIsFocused = false;
    taioLeaveTimestamp = Date.now();
    broadcastDataSync('appFocus', {
      isFocused: false,
      leaveTime: taioLeaveTimestamp,
      frontApp: latestFrontApp,
    });
  } else if (hasFocus && !taioIsFocused) {
    taioIsFocused = true;
    const returnTime = Date.now();
    const durationSec = taioLeaveTimestamp ? Math.round((returnTime - taioLeaveTimestamp) / 1000) : 0;
    broadcastDataSync('appFocus', {
      isFocused: true,
      leaveTime: taioLeaveTimestamp,
      returnTime,
      durationSec,
      frontApp: latestFrontApp,
    });
    taioLeaveTimestamp = null;
  }
}

app.on('browser-window-blur', () => {
  if (focusDebounceTimer) clearTimeout(focusDebounceTimer);
  focusDebounceTimer = setTimeout(evaluateTaioFocus, 150);
});

app.on('browser-window-focus', () => {
  if (focusDebounceTimer) clearTimeout(focusDebounceTimer);
  focusDebounceTimer = setTimeout(evaluateTaioFocus, 60);
});

// Part A3: Bounds Persistence with Migration
function getWindowsDataDir() {
  const dir = path.join(app.getPath('userData'), 'windows');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return dir;
}

function migrateLegacyBounds() {
  const winDir = getWindowsDataDir();
  const legacyMap = [
    { old: 'clock-window.json', target: 'clock.json' },
    { old: 'quick-note-window.json', target: 'quick-note.json' },
    { old: 'day-sheet-window.json', target: 'day-sheet.json' },
  ];
  for (const { old, target } of legacyMap) {
    const oldPath = path.join(app.getPath('userData'), old);
    const targetPath = path.join(winDir, target);
    if (fs.existsSync(oldPath) && !fs.existsSync(targetPath)) {
      try {
        fs.copyFileSync(oldPath, targetPath);
      } catch (err) {
        console.warn(`[main] Failed to migrate ${old}:`, err);
      }
    }
  }
}

function getPersistedBounds(id, defaultWidth, defaultHeight) {
  let saved = null;
  try {
    const filePath = path.join(getWindowsDataDir(), `${id}.json`);
    if (fs.existsSync(filePath)) {
      saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn(`[main] Failed to read bounds for ${id}:`, e);
  }

  let defaultX = 100;
  let defaultY = 100;
  try {
    const primary = screen.getPrimaryDisplay();
    const primaryWorkArea = primary.workArea;
    defaultX = Math.round(primaryWorkArea.x + primaryWorkArea.width - defaultWidth - 24);
    defaultY = Math.round(primaryWorkArea.y + 24);
  } catch (e) {}

  if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') {
    return { x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight };
  }

  // Multi-monitor safety check
  try {
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(d => {
      const wa = d.workArea;
      return (
        saved.x + (saved.width || defaultWidth) - 50 >= wa.x &&
        saved.x + 50 <= wa.x + wa.width &&
        saved.y + (saved.height || defaultHeight) - 50 >= wa.y &&
        saved.y + 50 <= wa.y + wa.height
      );
    });

    if (!isVisible) {
      return { x: defaultX, y: defaultY, width: saved.width || defaultWidth, height: saved.height || defaultHeight };
    }
  } catch (e) {}

  return {
    x: saved.x,
    y: saved.y,
    width: saved.width || defaultWidth,
    height: saved.height || defaultHeight,
  };
}

function persistWindowBounds(id, bounds) {
  if (boundsSaveTimeouts.has(id)) {
    clearTimeout(boundsSaveTimeouts.get(id));
  }
  const timeout = setTimeout(() => {
    try {
      const filePath = path.join(getWindowsDataDir(), `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(bounds, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[main] Failed to write bounds for ${id}:`, e);
    }
  }, 500);
  boundsSaveTimeouts.set(id, timeout);
}

// Part A1: Scan & Load Window Registry
function loadWindowRegistry() {
  windowRegistry.clear();
  if (!fs.existsSync(WINDOWS_DIR)) return;

  const entries = fs.readdirSync(WINDOWS_DIR);
  for (const name of entries) {
    const dir = path.join(WINDOWS_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const jsonPath = path.join(dir, 'window.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (config.id) {
          config._folder = dir;
          windowRegistry.set(config.id, config);
        }
      } catch (err) {
        console.error(`[main] Error reading window.json in ${name}:`, err);
      }
    }
  }
}

function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(WEB_DIR, rel));
  if (!file.startsWith(WEB_DIR)) return path.join(WEB_DIR, '404.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) file = path.join(WEB_DIR, 'index.html');
  return file;
}

// Main App Window
function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

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
  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && !isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('did-finish-load', () => {
    flushQuickNoteQueue();
  });
  return mainWindow;
}

const quickNoteQueue = [];
function flushQuickNoteQueue() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.webContents) return;
  while (quickNoteQueue.length > 0) {
    const note = quickNoteQueue.shift();
    mainWindow.webContents.send('taio-quick-note-received', note);
  }
}

// Part A2 & B1: Dynamic Window Opener
function openWindow(id) {
  if (id === 'main') {
    return createWindow();
  }

  const existing = activeWindows.get(id);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
    // Clock window requires real-time timer sync when restored/focused
    if (id === 'clock') syncClockWindowData();
    return existing;
  }

  const config = windowRegistry.get(id);
  if (!config) {
    console.warn(`[main] Window not found in registry: ${id}`);
    return null;
  }

  if (config.autoMinimizeMain && autoMinimizeOnClock && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.minimize();
  }

  const bounds = getPersistedBounds(id, config.defaultWidth || 300, config.defaultHeight || 200);

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: config.minWidth || 180,
    minHeight: config.minHeight || 100,
    maxWidth: config.maxWidth || undefined,
    maxHeight: config.maxHeight || undefined,
    x: bounds.x,
    y: bounds.y,
    frame: Boolean(config.frame),
    alwaysOnTop: Boolean(config.alwaysOnTop),
    resizable: config.resizable !== false,
    movable: config.movable !== false,
    skipTaskbar: Boolean(config.skipTaskbar),
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: config.frame ? 'default' : 'hidden',
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') },
  });

  if (process.platform === 'darwin' && !config.frame && typeof win.setWindowButtonVisibility === 'function') {
    win.setWindowButtonVisibility(false);
  }

  win.on('resize', () => {
    if (win && !win.isDestroyed()) persistWindowBounds(id, win.getBounds());
  });
  win.on('move', () => {
    if (win && !win.isDestroyed()) persistWindowBounds(id, win.getBounds());
  });

  // Load target
  if (config.type === 'app-route') {
    win.loadURL(`${SCHEME}://${HOST}/${config.route || 'index.html'}`);
  } else {
    const entryFile = path.join(config._folder, config.entry || 'index.html');
    if (fs.existsSync(entryFile)) {
      win.loadFile(entryFile);
    } else {
      console.error(`[main] Entry file not found for window ${id}: ${entryFile}`);
    }
  }

  win.once('ready-to-show', () => {
    win.show();
    // Clock window receives initial timer and task states upon ready
    if (id === 'clock') syncClockWindowData();
  });

  win.on('closed', () => {
    activeWindows.delete(id);
    // Notify main window so day sheet button state remains synchronized
    if (id === 'day-sheet' && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('taio-day-sheet-closed');
    }
  });

  // Notify main window that day sheet is currently open
  if (id === 'day-sheet' && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('taio-day-sheet-opened');
  }

  activeWindows.set(id, win);
  return win;
}

function closeWindow(id) {
  const win = activeWindows.get(id);
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

function toggleWindow(id) {
  const win = activeWindows.get(id);
  if (win && !win.isDestroyed() && win.isVisible()) {
    win.close();
  } else {
    openWindow(id);
  }
}

function pinWindow(id, isPinned) {
  const win = activeWindows.get(id);
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(isPinned);
  }
}

function setWindowHeight(id, height) {
  const win = activeWindows.get(id);
  if (win && !win.isDestroyed()) {
    const config = windowRegistry.get(id) || {};
    const minW = config.minWidth || 180;
    const minH = height <= 50 ? height : (config.minHeight || 40);
    win.setMinimumSize(minW, minH);
    const [w] = win.getSize();
    win.setSize(w, height);
  }
}

// Part B3: Single Data Push Channel (No executeJavaScript)
function syncClockWindowData() {
  const clockWin = activeWindows.get('clock');
  if (!clockWin || clockWin.isDestroyed() || !clockWin.webContents) return;
  try {
    clockWin.webContents.send('taio-sync-timer', currentTimerData);
  } catch (err) {
    console.error('[main] syncClockWindowData IPC send failed', err);
  }
}

function broadcastDataSync(collection, data) {
  for (const [id, win] of activeWindows.entries()) {
    if (win && !win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send(`taio-data-sync:${collection}`, data);
      } catch {}
    }
  }
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    try {
      mainWindow.webContents.send(`taio-data-sync:${collection}`, data);
    } catch {}
  }
}

// Part A4: Dynamic Tray Menu
function getWindowTrayLabel(config, lang) {
  const folder = config._folder;
  let label = config.id;
  const langFile = path.join(folder, `lang.${lang}.json`);
  if (fs.existsSync(langFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(langFile, 'utf8'));
      label = data.trayTitle || data.title || label;
    } catch {}
  }
  return label;
}

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
  const isEn = currentLang === 'en';

  const menuItems = [
    { label: timerLabel, enabled: false },
    { type: 'separator' },
  ];

  for (const [id, config] of windowRegistry.entries()) {
    if (config.trayMenu) {
      const label = getWindowTrayLabel(config, currentLang);
      menuItems.push({
        label,
        click: () => openWindow(id),
      });
    }
  }

  menuItems.push(
    { type: 'separator' },
    {
      label: isEn ? 'Open TAIO Time' : 'Mở TAIO Time',
      click: () => openWindow('main'),
    },
    { type: 'separator' },
    {
      label: isEn ? 'Quit' : 'Thoát',
      click: () => { isQuitting = true; app.quit(); },
    }
  );

  tray.setContextMenu(Menu.buildFromTemplate(menuItems));
}

// Part A4 & A5: Register Global Shortcuts with Error Recording
function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  failedShortcuts.length = 0;

  for (const [id, config] of windowRegistry.entries()) {
    const shortcut = config.defaultShortcut;
    if (shortcut) {
      const success = globalShortcut.register(shortcut, () => {
        openWindow(id);
      });
      if (!success) {
        failedShortcuts.push({
          id,
          shortcut,
          reason: 'taken_by_another_app',
          message: `Shortcut ${shortcut} for ${id} was already registered by another application`,
        });
        console.warn(`[shortcuts] Conflict: ${shortcut} for window "${id}" is taken.`);
      }
    }
  }
}

// --- IPC Data Dispatcher (Part B1 & B2) ---
ipcMain.handle('taio-data-get', async (_event, collection, query) => {
  if (collection === 'timer' || collection === 'clock') {
    return currentTimerData;
  }
  if (collection === 'failedShortcuts') {
    return failedShortcuts;
  }
  if (collection === 'frontApp') {
    return latestFrontApp;
  }
  if (collection === 'appFocus') {
    return { isFocused: taioIsFocused, leaveTime: taioLeaveTimestamp, frontApp: latestFrontApp };
  }
  return null;
});

ipcMain.on('taio-data-act', (_event, { collection, action, payload }) => {
  if (collection === 'quickNotes' && action === 'create') {
    const text = payload?.text || '';
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
      mainWindow.webContents.send('taio-quick-note-received', text);
    } else {
      quickNoteQueue.push(text);
    }
    return;
  }
  if (collection === 'scheduledEvents' && action === 'openInApp') {
    openWindow('main');
  }
  // Forward act to main window
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('taio-data-act', { collection, action, payload });
  }
  // Broadcast to other windows
  broadcastDataSync(collection, payload);
});

ipcMain.handle('taio-lang-get', () => currentLang);

ipcMain.on('taio-window-open', (_e, id) => openWindow(id));
ipcMain.on('taio-window-close', (_e, id) => closeWindow(id));
ipcMain.on('taio-window-toggle', (_e, id) => toggleWindow(id));
ipcMain.on('taio-window-pin', (_e, { id, isPinned }) => pinWindow(id, isPinned));
ipcMain.on('taio-window-set-height', (_e, { id, height }) => setWindowHeight(id, height));

// --- Legacy Compatibility IPC Listeners (Part B4) ---
ipcMain.on('taio-quick-note', (_event, noteText) => {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('taio-quick-note-received', noteText);
  } else {
    quickNoteQueue.push(noteText);
  }
});

ipcMain.on('taio-timer-update', (_event, payload) => {
  if (typeof payload === 'string') {
    timerLabel = payload || 'TAIO Time';
  } else if (payload && typeof payload === 'object') {
    currentTimerData = { ...currentTimerData, ...payload };
    if (payload.lang) currentLang = payload.lang;
    if (payload.title) timerLabel = `${payload.title} · ${payload.remaining || ''}`.trim();
    syncClockWindowData();
  }
  updateTrayMenu();
});

ipcMain.on('taio-lang-update', (_event, lang) => {
  if (lang) {
    currentLang = lang;
    updateTrayMenu();
    for (const [, win] of activeWindows.entries()) {
      if (win && !win.isDestroyed() && win.webContents) {
        win.webContents.send('taio-lang-update', lang);
      }
    }
  }
});

ipcMain.on('taio-open-clock', () => openWindow('clock'));
ipcMain.on('taio-open-day-sheet-window', () => openWindow('day-sheet'));
ipcMain.on('taio-bring-to-front', () => openWindow('main'));
ipcMain.on('taio-set-auto-minimize-clock', (_event, enabled) => {
  autoMinimizeOnClock = Boolean(enabled);
});
ipcMain.handle('taio-get-timer', () => currentTimerData);
ipcMain.on('taio-clock-ready', () => syncClockWindowData());
ipcMain.on('taio-clock-error', (_event, errorData) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('taio-clock-error', errorData);
  }
});
ipcMain.on('taio-timer-action', (_event, action) => {
  if (action && action.type === 'toggle-pin') {
    pinWindow('clock', !!action.pinned);
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('taio-timer-action', action);
  }
});
ipcMain.on('taio-open-today-journal', (_event, taskId) => {
  const win = openWindow('main');
  if (win && win.webContents) {
    win.webContents.send('taio-open-today-journal', taskId);
  }
});

// App lifecycle
app.on('before-quit', () => { isQuitting = true; });

app.whenReady().then(() => {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    return net.fetch(pathToFileURL(resolveFile(pathname)).toString());
  });

  migrateLegacyBounds();
  loadWindowRegistry();
  initFrontAppObserver();
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    openWindow('main');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (frontAppProcess) {
    try { frontAppProcess.kill(); } catch (_) {}
  }
  globalShortcut.unregisterAll();
});
