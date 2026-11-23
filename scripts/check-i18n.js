// TAIO Time App - i18n Automated Validation Script (PRD v0.3.34 Part C3)
const fs = require('fs');
const path = require('path');

const VI_DIR = path.join(__dirname, '../src/i18n/vi');
const EN_DIR = path.join(__dirname, '../src/i18n/en');

const viFiles = fs.readdirSync(VI_DIR).filter(f => f.endsWith('.json'));
const enFiles = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));

let errors = [];

// Check file parity
const viFileSet = new Set(viFiles);
const enFileSet = new Set(enFiles);
for (const f of viFileSet) {
  if (!enFileSet.has(f)) errors.push(`Missing file in English: ${f}`);
}
for (const f of enFileSet) {
  if (!viFileSet.has(f)) errors.push(`Missing file in Vietnamese: ${f}`);
}

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

let totalKeys = 0;

for (const file of viFiles) {
  const viPath = path.join(VI_DIR, file);
  const enPath = path.join(EN_DIR, file);
  if (!fs.existsSync(enPath)) continue;

  const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const viKeys = new Set(getKeys(vi));
  const enKeys = new Set(getKeys(en));
  totalKeys += viKeys.size;

  for (const k of viKeys) {
    if (!enKeys.has(k)) {
      errors.push(`[${file}] Missing key in English: ${k}`);
    }
  }

  for (const k of enKeys) {
    if (!viKeys.has(k)) {
      errors.push(`[${file}] Missing key in Vietnamese: ${k}`);
    }
  }

  // Check no English in parentheses in Vietnamese
  const parenRegex = /\([A-Z][a-zA-Z\s]{2,}\)/;
  function checkParen(obj, prefix = '') {
    for (const k of Object.keys(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      const val = obj[k];
      if (typeof val === 'string') {
        if (parenRegex.test(val)) {
          errors.push(`[${file}] English in parentheses in VI [${full}]: "${val}"`);
        }
      } else if (typeof val === 'object' && val !== null) {
        checkParen(val, full);
      }
    }
  }
  checkParen(vi);

  // Check English translations do NOT have Vietnamese accents
  const vietRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
  function checkViInEn(obj, prefix = '') {
    for (const k of Object.keys(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      const val = obj[k];
      if (typeof val === 'string') {
        if (vietRegex.test(val)) {
          errors.push(`[${file}] Vietnamese accented text in EN [${full}]: "${val}"`);
        }
      } else if (typeof val === 'object' && val !== null) {
        checkViInEn(val, full);
      }
    }
  }
  checkViInEn(en);
}

// PRD v0.3.51 Part F: Validate desktop/windows translation files
const WINDOWS_DIR = path.join(__dirname, '../desktop/windows');
let windowKeyCount = 0;
if (fs.existsSync(WINDOWS_DIR)) {
  const windowDirs = fs.readdirSync(WINDOWS_DIR).filter(d => {
    return fs.statSync(path.join(WINDOWS_DIR, d)).isDirectory();
  });

  for (const winDir of windowDirs) {
    const viWinPath = path.join(WINDOWS_DIR, winDir, 'lang.vi.json');
    const enWinPath = path.join(WINDOWS_DIR, winDir, 'lang.en.json');

    if (!fs.existsSync(viWinPath)) {
      errors.push(`[desktop/windows/${winDir}] Missing lang.vi.json`);
      continue;
    }
    if (!fs.existsSync(enWinPath)) {
      errors.push(`[desktop/windows/${winDir}] Missing lang.en.json`);
      continue;
    }

    try {
      const viData = JSON.parse(fs.readFileSync(viWinPath, 'utf8'));
      const enData = JSON.parse(fs.readFileSync(enWinPath, 'utf8'));

      const viKeys = new Set(getKeys(viData));
      const enKeys = new Set(getKeys(enData));
      windowKeyCount += viKeys.size;

      for (const k of viKeys) {
        if (!enKeys.has(k)) {
          errors.push(`[desktop/windows/${winDir}] Missing key in lang.en.json: ${k}`);
        }
      }
      for (const k of enKeys) {
        if (!viKeys.has(k)) {
          errors.push(`[desktop/windows/${winDir}] Missing key in lang.vi.json: ${k}`);
        }
      }
    } catch (err) {
      errors.push(`[desktop/windows/${winDir}] JSON parse error: ${err.message}`);
    }
  }
}

// PRD v0.3.54 Part I (A5): Guard against hardcoded language ternaries in .tsx
const SRC_DIR = path.join(__dirname, '../src');
const HARDCODED_TERNARY_BASELINE = 457; // Monitored baseline post-ProfileModal cleanup
let hardcodedTernaryCount = 0;
const ternaryRegex = /language\s*===\s*['"](?:vi|en)['"]\s*\?/g;

function scanTsxFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanTsxFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(ternaryRegex);
      if (matches) {
        hardcodedTernaryCount += matches.length;
        if (entry.name === 'ProfileModal.tsx') {
          errors.push(`[ProfileModal.tsx] Must have 0 hardcoded language ternaries, but found ${matches.length}`);
        }
      }
    }
  }
}
scanTsxFiles(SRC_DIR);

if (hardcodedTernaryCount > HARDCODED_TERNARY_BASELINE) {
  errors.push(`Hardcoded language ternaries count increased: found ${hardcodedTernaryCount}, baseline is ${HARDCODED_TERNARY_BASELINE}. Move new strings to src/i18n/*.json.`);
}

if (errors.length > 0) {
  console.error(`\x1b[31m[check-i18n] FAILED with ${errors.length} error(s):\x1b[0m`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`\x1b[32m[check-i18n] PASSED: All ${totalKeys + windowKeyCount} keys across domain and mini app windows match 100% with clean translations (hardcoded ternaries: ${hardcodedTernaryCount}/${HARDCODED_TERNARY_BASELINE}).\x1b[0m`);
  process.exit(0);
}
