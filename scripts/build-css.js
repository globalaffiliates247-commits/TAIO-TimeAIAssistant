const tw = require('tailwindcss');
const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

async function build() {
  const srcDir = path.resolve(__dirname, '../src');
  const files = getAllFiles(srcDir);
  
  // Extract all words/candidates
  const candidateSet = new Set();
  const wordRegex = /([a-zA-Z0-9_\-\/\[\]\:\%\#\.\=\(\)\,\!]+)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = wordRegex.exec(content)) !== null) {
      const candidate = match[1];
      if (candidate.length > 1 && !candidate.startsWith('//') && !candidate.startsWith('/*')) {
        candidateSet.add(candidate);
      }
    }
  }

  console.log(`Found ${candidateSet.size} candidate tokens across ${files.length} source files.`);

  const compiler = await tw.compile('@import "tailwindcss"; @theme { --color-brand: var(--taio-brand); --color-brand-hover: var(--taio-brand-hover); --color-brand-soft: var(--taio-brand-soft); }', {
    base: path.resolve(__dirname, '..'),
    loadStylesheet: async (id, base) => {
      let resolvedPath;
      if (id === 'tailwindcss') {
        resolvedPath = path.resolve(__dirname, '../node_modules/tailwindcss/index.css');
      } else {
        resolvedPath = path.resolve(base, id);
      }
      return {
        base: path.dirname(resolvedPath),
        content: fs.readFileSync(resolvedPath, 'utf8')
      };
    }
  });

  const generatedCss = compiler.build(Array.from(candidateSet));
  console.log(`Generated CSS size: ${generatedCss.length} bytes.`);

  const customCss = `
:root,
html,
html[data-palette="red"] {
  --taio-brand: #E11D2E;
  --taio-brand-hover: #C4182A;
  --taio-brand-soft: #FDE8EA;
  --taio-brand-accent: #E11D2E;
  --background: #ffffff;
  --foreground: #0f172a;
  --native-sat: 0px;
  --native-sab: 0px;
  --sat: max(env(safe-area-inset-top, 0px), var(--native-sat, 0px));
  --sab: max(env(safe-area-inset-bottom, 0px), var(--native-sab, 0px));
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}

html[data-palette="bright-blue"] {
  --taio-brand: #0068FF;
  --taio-brand-hover: #0055D4;
  --taio-brand-soft: #E6F0FF;
  --taio-brand-accent: #0068FF;
}

html[data-palette="calm-blue"] {
  --taio-brand: #1C78C0;
  --taio-brand-hover: #17669F;
  --taio-brand-soft: #E8F4FC;
  --taio-brand-accent: #2AABEE;
}

/* Dark mode adjustments */
html.dark[data-palette="red"],
html[data-theme="dark"][data-palette="red"] {
  --taio-brand: #EF3042;
  --taio-brand-hover: #E11D2E;
  --taio-brand-soft: rgba(225, 29, 46, 0.22);
  --taio-brand-accent: #EF3042;
}
html.dark[data-palette="bright-blue"],
html[data-theme="dark"][data-palette="bright-blue"] {
  --taio-brand: #2B7FFF;
  --taio-brand-hover: #0068FF;
  --taio-brand-soft: rgba(0, 104, 255, 0.22);
  --taio-brand-accent: #2B7FFF;
}
html.dark[data-palette="calm-blue"],
html[data-theme="dark"][data-palette="calm-blue"] {
  --taio-brand: #2AABEE;
  --taio-brand-hover: #1C78C0;
  --taio-brand-soft: rgba(28, 120, 192, 0.22);
  --taio-brand-accent: #2AABEE;
}

/* Platform Corner Radii (PRD v0.3.47 Part D3) */
:root,
html,
html[data-device-look="auto"],
html[data-device-look="macos"],
html[data-device-look="phone"] {
  --radius-control: 10px;
  --radius-card: 14px;
  --radius-overlay: 16px;
  --radius-tile: 14px;
}

html[data-device-look="windows"] {
  --radius-control: 4px;
  --radius-card: 8px;
  --radius-overlay: 8px;
  --radius-tile: 4px;
}

@supports (corner-shape: squircle) {
  .squircle-tile,
  [data-squircle="true"] {
    corner-shape: squircle;
  }
}

/* Guaranteed hardware safe-area floor on iPhone portrait (iOS WebKit / WKWebView / IPA) */
@supports (-webkit-touch-callout: none) {
  @media (max-width: 600px) and (orientation: portrait) {
    :root {
      --native-sat: 59px;
      --native-sab: 34px;
      --sat: max(env(safe-area-inset-top, 0px), var(--native-sat, 59px));
      --sab: max(env(safe-area-inset-bottom, 0px), var(--native-sab, 34px));
    }
  }
}

html.is-native-ios {
  --native-sat: 59px;
  --native-sab: 34px;
  --sat: max(env(safe-area-inset-top, 0px), var(--native-sat, 59px));
  --sab: max(env(safe-area-inset-bottom, 0px), var(--native-sab, 34px));
}

.app-overlay-safe {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: calc(var(--sat, 0px) + 12px);
  padding-bottom: calc(var(--sab, 0px) + 12px);
  padding-left: max(var(--sal, 0px), 12px);
  padding-right: max(var(--sar, 0px), 12px);
}

.app-bottom-sheet-safe {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: calc(var(--sat, 0px) + 16px);
  padding-bottom: var(--sab, 0px);
}

html, body {
  background-color: #ffffff;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Be Vietnam Pro", sans-serif;
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
}

body {
  overflow-x: clip;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f8fafc;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

/* Bulletproof Brand color variable classes with solid hex fallback */
.bg-\\[var\\(--taio-brand\\)\\] { background-color: #E11D2E !important; background-color: var(--taio-brand, #E11D2E) !important; }
.hover\\:bg-\\[var\\(--taio-brand-hover\\)\\]:hover { background-color: #C4182A !important; background-color: var(--taio-brand-hover, #C4182A) !important; }
.bg-\\[var\\(--taio-brand-soft\\)\\] { background-color: #FDE8EA !important; background-color: var(--taio-brand-soft, #FDE8EA) !important; }
.text-\\[var\\(--taio-brand\\)\\] { color: #E11D2E !important; color: var(--taio-brand, #E11D2E) !important; }
.border-\\[var\\(--taio-brand\\)\\] { border-color: #E11D2E !important; border-color: var(--taio-brand, #E11D2E) !important; }
.focus\\:border-\\[var\\(--taio-brand\\)\\]:focus { border-color: #E11D2E !important; border-color: var(--taio-brand, #E11D2E) !important; }
.ring-\\[var\\(--taio-brand\\)\\] { --tw-ring-color: #E11D2E !important; --tw-ring-color: var(--taio-brand, #E11D2E) !important; }
.focus\\:ring-\\[var\\(--taio-brand\\)\\]:focus { --tw-ring-color: #E11D2E !important; --tw-ring-color: var(--taio-brand, #E11D2E) !important; }
.shadow-\\[var\\(--taio-brand\\)\\]\\/20 { --tw-shadow-color: rgba(225, 29, 46, 0.2) !important; --tw-shadow-color: var(--taio-brand, rgba(225, 29, 46, 0.2)) !important; }
`;

  const finalCss = generatedCss + "\n" + customCss;
  const outPath = path.resolve(__dirname, '../src/app/globals.css');
  fs.writeFileSync(outPath, finalCss, 'utf8');
  console.log(`Successfully written compiled CSS to ${outPath}!`);
}

build().catch(err => {
  console.error('Build CSS failed:', err);
  process.exit(1);
});
