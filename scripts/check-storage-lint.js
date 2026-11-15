// Build-time check for storage abstraction & pure domain rules (PRD v0.3.38 Part F)
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const allowlistPath = path.resolve(rootDir, 'lint-legacy-allowlist');

if (!fs.existsSync(allowlistPath)) {
  console.error('[check-storage-lint] Error: lint-legacy-allowlist missing');
  process.exit(1);
}

const allowlist = new Set(
  fs.readFileSync(allowlistPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
);

const violations = [];
const domainViolations = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const rawContent = fs.readFileSync(fullPath, 'utf8');
      // Strip comments before analyzing code usage
      const codeOnly = rawContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '');

      // Check localStorage usage in src/
      if (codeOnly.includes('localStorage')) {
        if (!allowlist.has(relPath)) {
          violations.push(relPath);
        }
      }

      // Check src/domain/ purity (no React, no DOM, no localStorage)
      if (relPath.startsWith('src/domain/')) {
        if (/from\s+['"]react['"]/.test(codeOnly) || /import\s+['"]react['"]/.test(codeOnly)) {
          domainViolations.push(`${relPath}: imports React (must be pure functions)`);
        }
        if (codeOnly.includes('localStorage') || codeOnly.includes('window.') || codeOnly.includes('document.')) {
          domainViolations.push(`${relPath}: accesses DOM / localStorage (must be pure functions)`);
        }
      }
    }
  }
}

scanDir(path.resolve(rootDir, 'src'));

let hasError = false;

if (violations.length > 0) {
  console.error('[check-storage-lint] VIOLATION: The following new files call localStorage directly:');
  violations.forEach(f => console.error(`  - ${f}`));
  console.error('New code must use src/core/storage abstraction layer instead of direct localStorage.');
  hasError = true;
}

if (domainViolations.length > 0) {
  console.error('[check-storage-lint] VIOLATION: Pure domain rules violated in src/domain/:');
  domainViolations.forEach(f => console.error(`  - ${f}`));
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`[check-storage-lint] OK: All ${allowlist.size} allowed legacy files pass; no unauthorized localStorage calls.`);
}
