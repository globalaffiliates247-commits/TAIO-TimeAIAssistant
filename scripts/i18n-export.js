// TAIO Time App — i18n CSV Export Tool (PRD v0.3.34 Part C3)
const fs = require('fs');
const path = require('path');

const VI_DIR = path.join(__dirname, '../src/i18n/vi');
const EN_DIR = path.join(__dirname, '../src/i18n/en');
const OUT_FILE = path.join(__dirname, '../src/i18n/translations_export.csv');

function escapeCsv(str) {
  if (typeof str !== 'string') return '';
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function inferContext(key, val) {
  if (key.includes('title') || key.includes('header')) return 'Tiêu đề / Header';
  if (key.includes('btn') || key.includes('button') || key.includes('action')) return 'Nút bấm / Action button';
  if (key.includes('hint') || key.includes('placeholder')) return 'Gợi ý nhập liệu / Placeholder';
  if (key.includes('desc') || key.includes('subtitle')) return 'Mô tả ngắn / Subtitle';
  if (key.includes('error') || key.includes('warn') || key.includes('alert')) return 'Thông báo lỗi / Cảnh báo';
  return 'Chuỗi giao diện / UI Label';
}

function flatten(obj, prefix = '') {
  let res = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      res = res.concat(flatten(obj[k], full));
    } else {
      res.push({ key: full, val: String(obj[k]) });
    }
  }
  return res;
}

const files = fs.readdirSync(VI_DIR).filter(f => f.endsWith('.json'));
let rows = ['domain,key,context,vi,en,target_translation'];

for (const file of files) {
  const domain = file.replace('.json', '');
  const vi = JSON.parse(fs.readFileSync(path.join(VI_DIR, file), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(EN_DIR, file), 'utf8'));

  const viList = flatten(vi);
  const enMap = new Map(flatten(en).map(item => [item.key, item.val]));

  for (const item of viList) {
    const enVal = enMap.get(item.key) || '';
    const ctx = inferContext(item.key, item.val);
    rows.push(`${escapeCsv(domain)},${escapeCsv(item.key)},${escapeCsv(ctx)},${escapeCsv(item.val)},${escapeCsv(enVal)},""`);
  }
}

fs.writeFileSync(OUT_FILE, rows.join('\n') + '\n', 'utf8');
console.log(`[i18n:export] Exported ${rows.length - 1} entries to ${OUT_FILE}`);
