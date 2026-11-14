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

if (errors.length > 0) {
  console.error(`\x1b[31m[check-i18n] FAILED with ${errors.length} error(s):\x1b[0m`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`\x1b[32m[check-i18n] PASSED: All ${totalKeys} keys across ${viFiles.length} domain files match 100% with clean translations.\x1b[0m`);
  process.exit(0);
}
