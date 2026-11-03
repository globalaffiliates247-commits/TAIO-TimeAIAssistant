const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OUT_DIR = path.resolve(__dirname, '../out');
const SHARE_DIR = path.join(OUT_DIR, 'share');

// Ensure share dir exists
if (!fs.existsSync(SHARE_DIR)) {
  fs.mkdirSync(SHARE_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // CORS & headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const reqPath = decodeURI(urlParts[0]);

  // PRD B24 Endpoint: POST /api/exports
  if (req.method === 'POST' && reqPath === '/api/exports') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { token, exportId, date, markdown } = payload;
        if (!token || !markdown) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing token or markdown content' }));
          return;
        }

        const userShareDir = path.join(SHARE_DIR, token);
        const exportsSubDir = path.join(userShareDir, 'exports');
        fs.mkdirSync(exportsSubDir, { recursive: true });

        // Write latest.md
        fs.writeFileSync(path.join(userShareDir, 'latest.md'), markdown, 'utf-8');
        // Write {yyyy-mm-dd}.md
        if (date) {
          fs.writeFileSync(path.join(userShareDir, `${date}.md`), markdown, 'utf-8');
        }
        // Write exports/{exportId}.md
        const exactId = exportId || `exp_${Date.now()}`;
        fs.writeFileSync(path.join(exportsSubDir, `${exactId}.md`), markdown, 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          exportId: exactId,
          shareUrlLatest: `/share/${token}/latest.md`,
          shareUrlExact: `/share/${token}/exports/${exactId}.md`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // PRD B24 Endpoint: GET /share/{token}/*.md
  if (req.method === 'GET' && reqPath.startsWith('/share/')) {
    const relSharePath = reqPath.replace(/^\/share\//, '');
    const targetFile = path.join(SHARE_DIR, relSharePath);

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const content = fs.readFileSync(targetFile, 'utf-8');
      res.writeHead(200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      });
      res.end(content);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: Snapshot does not exist or has expired.');
      return;
    }
  }

  // Static files handling
  let filePath = path.join(OUT_DIR, reqPath === '/' || reqPath === '' ? '/index.html' : reqPath);

  // If directory, try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file doesn't exist, try appending .html (Next.js clean URLs)
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Fallback to index.html for SPA
  if (!fs.existsSync(filePath)) {
    filePath = path.join(OUT_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`TAIO Time App v0.3.4 Static & API Server running:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Local:   http://127.0.0.1:${PORT}`);
  console.log(`Serving static files from: ${OUT_DIR}`);
});
