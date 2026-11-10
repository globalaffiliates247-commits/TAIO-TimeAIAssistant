// Render an SVG to PNGs (via Playwright Chromium) and pack them into a macOS .icns.
// Usage: node scripts/make-icns.js <in.svg> <out.icns>
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// icns type -> pixel size (PNG payloads)
const TYPES = [['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]];

(async () => {
  const [svgPath, outPath] = process.argv.slice(2);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const cache = {};
  const chunks = [];
  for (const [type, size] of TYPES) {
    if (!cache[size]) {
      await page.setViewportSize({ width: size, height: size });
      // macOS icon grid: artwork ~80% of the canvas, centered
      await page.setContent(`<html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">
        <div style="width:${Math.round(size * 0.82)}px;height:${Math.round(size * 0.82)}px">${svg.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div></body></html>`);
      cache[size] = await page.screenshot({ omitBackground: true });
    }
    const head = Buffer.alloc(8);
    head.write(type, 0, 'ascii');
    head.writeUInt32BE(cache[size].length + 8, 4);
    chunks.push(head, cache[size]);
  }
  await browser.close();
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 'ascii');
  header.writeUInt32BE(body.length + 8, 4);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([header, body]));
  console.log(`[make-icns] ${outPath}`);
})();
