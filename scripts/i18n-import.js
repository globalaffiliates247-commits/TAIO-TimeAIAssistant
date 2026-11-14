// TAIO Time App — i18n CSV Import Tool (PRD v0.3.34 Part C3)
const fs = require('fs');
const path = require('path');

const targetLang = process.argv[2] || 'th';
const csvFile = process.argv[3] || path.join(__dirname, '../src/i18n/translations_export.csv');

if (!fs.existsSync(csvFile)) {
  console.error(`[i18n:import] CSV file not found: ${csvFile}`);
  process.exit(1);
}

function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex parser for CSV with quoted strings
    const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!match) continue;
    const cols = match.map(c => {
      let v = c.replace(/^,/, '').trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });
    if (cols.length >= 6) {
      rows.push({
        domain: cols[0],
        key: cols[1],
        context: cols[2],
        vi: cols[3],
        en: cols[4],
        target: cols[5] || cols[4] || cols[3] // Fallback to en or vi if target is empty
      });
    }
  }
  return rows;
}

const csvData = fs.readFileSync(csvFile, 'utf8');
const entries = parseCsv(csvData);

const outDir = path.join(__dirname, '../src/i18n', targetLang);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Group by domain
const byDomain = {};
for (const row of entries) {
  if (!byDomain[row.domain]) byDomain[row.domain] = {};

  const parts = row.key.split('.');
  let curr = byDomain[row.domain];
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = row.target;
}

for (const [dom, obj] of Object.entries(byDomain)) {
  const filePath = path.join(outDir, `${dom}.json`);
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`[i18n:import] Generated ${filePath}`);
}

console.log(`[i18n:import] Successfully imported language '${targetLang}' with ${entries.length} keys.`);
