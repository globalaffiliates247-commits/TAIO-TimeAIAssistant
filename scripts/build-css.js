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
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  background-color: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Glassmorphism utility classes matching Shotcipdownload */
.glass {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-dropdown {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0b0f19;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569;
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
