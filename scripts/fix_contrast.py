#!/usr/bin/env python3
"""Fix low-contrast leftovers from the old dark theme (orange/colored text on dark, light text on white)."""
import os, re

ROOT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src/components"

RULES = [
    # Dark tinted backgrounds -> soft light tints
    (r'\b(hover:)?bg-(red|rose|orange|amber|yellow|emerald|green|teal|cyan|sky|blue|indigo|purple|violet|pink)-(900|950)(/\d+)?\b', r'\1bg-\2-50'),
    # Dark tinted borders -> light borders
    (r'\bborder-(red|rose|orange|amber|yellow|emerald|green|teal|cyan|sky|blue|indigo|purple|violet|pink)-(800|900|950)(/\d+)?\b', r'border-\1-200'),
    # Dark gradient stops
    (r'\b(from|to|via)-(red|rose|orange|amber|emerald|blue|indigo|purple|violet|pink)-(900|950)(/\d+)?\b', r'\1-\2-50'),
    (r'\b(from|to|via)-(slate|gray)-900(/\d+)?\b', r'\1-white'),
    # Pale text that was designed for dark backgrounds -> readable on white
    (r'\btext-(red|rose|orange|amber|yellow|emerald|green|teal|cyan|sky|blue|indigo|purple|violet|pink)-(200|300)\b', r'text-\1-700'),
    (r'\btext-slate-300\b', 'text-slate-500'),
    # Dark hover states on light buttons
    (r'\bhover:bg-slate-(600|700)\b', 'hover:bg-slate-200'),
    # Muted dark chips
    (r'\bbg-slate-700/60\b', 'bg-slate-100'),
    # Heavy black modal backdrops -> softer scrim fitting the white theme
    (r'\bbg-black/80\b', 'bg-slate-900/40'),
    (r'\bbg-black/60\b', 'bg-slate-900/40'),
]
RULES = [(re.compile(a), b) for a, b in RULES]

total = 0
for fn in sorted(os.listdir(ROOT)):
    if not fn.endswith('.tsx'):
        continue
    p = os.path.join(ROOT, fn)
    s = open(p).read()
    n_file = 0
    for rx, rep in RULES:
        s, n = rx.subn(rep, s)
        n_file += n
    if n_file:
        open(p, 'w').write(s)
        print(f"  ✅ {fn}: {n_file}")
        total += n_file
print(f"\n🎯 Total: {total} contrast fixes")
