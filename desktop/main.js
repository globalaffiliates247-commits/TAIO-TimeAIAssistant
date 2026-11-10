// TAIO Time — macOS desktop shell (Electron).
// Loads the static Next.js export (out/) through a private app:// scheme so that
// absolute paths (/_next/...) resolve and IndexedDB / localStorage persist per user.
const { app, BrowserWindow, protocol, shell, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

const SCHEME = 'app';
const HOST = 'taio';
// Packaged: <App>.app/Contents/Resources/app/web ; dev: ../out
const WEB_DIR = fs.existsSync(path.join(__dirname, 'web'))
  ? path.join(__dirname, 'web')
  : path.resolve(__dirname, '../out');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(WEB_DIR, rel));
  if (!file.startsWith(WEB_DIR)) return path.join(WEB_DIR, '404.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) file = path.join(WEB_DIR, 'index.html'); // client-side routes
  return file;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'TAIO Time',
    backgroundColor: '#ffffff',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadURL(`${SCHEME}://${HOST}/index.html`);
  // External links open in the default browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`${SCHEME}://`)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    return net.fetch(pathToFileURL(resolveFile(pathname)).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
