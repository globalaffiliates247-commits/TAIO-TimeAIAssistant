// TAIO Time App - i18n Automated Validation Script (PRD v0.3.33 Part A4)
const fs = require('fs');
const path = require('path');

const VI_PATH = path.join(__dirname, '../src/i18n/vi/common.json');
const EN_PATH = path.join(__dirname, '../src/i18n/en/common.json');

const vi = JSON.parse(fs.readFileSync(VI_PATH, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

let errors = [];

// 1. Check 100% key parity
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

const viKeys = new Set(getKeys(vi));
const enKeys = new Set(getKeys(en));

for (const k of viKeys) {
  if (!enKeys.has(k)) {
    errors.push(`Missing key in English: ${k}`);
  }
}

for (const k of enKeys) {
  if (!viKeys.has(k)) {
    errors.push(`Missing key in Vietnamese: ${k}`);
  }
}

// 2. Check no English in parentheses in Vietnamese (e.g. "(Done)", "(Goals)")
const parenRegex = /\([A-Z][a-zA-Z\s]{2,}\)/;
function checkParen(obj, prefix = '') {
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (typeof val === 'string') {
      if (parenRegex.test(val)) {
        errors.push(`English in parentheses found in VI [${full}]: "${val}"`);
      }
    } else if (typeof val === 'object' && val !== null) {
      checkParen(val, full);
    }
  }
}
checkParen(vi);

// 3. Check English translations do NOT have Vietnamese accents
const vietRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
function checkViInEn(obj, prefix = '') {
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (typeof val === 'string') {
      if (vietRegex.test(val)) {
        errors.push(`Vietnamese accented text found in EN [${full}]: "${val}"`);
      }
    } else if (typeof val === 'object' && val !== null) {
      checkViInEn(val, full);
    }
  }
}
checkViInEn(en);

if (errors.length > 0) {
  console.error(`\x1b[31m[check-i18n] FAILED with ${errors.length} error(s):\x1b[0m`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`\x1b[32m[check-i18n] PASSED: All ${viKeys.size} keys match 100% with clean translations.\x1b[0m`);
  process.exit(0);
}
