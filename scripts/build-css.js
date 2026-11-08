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
  const wordRegex = /([a-zA-Z0-9_\-\/\[\]\:\%\#\.\>\<\=]+)/g;

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

  const compiler = await tw.compile('@import "tailwindcss";', {
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
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --native-sat: 0px;
  --native-sab: 0px;
  --sat: max(env(safe-area-inset-top, 0px), var(--native-sat, 0px));
  --sab: max(env(safe-area-inset-bottom, 0px), var(--native-sab, 0px));
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
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
