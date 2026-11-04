#!/usr/bin/env python3
"""Remove multi-line empty <span>/<div> badges left after stripping PRD text."""
import os, re

ROOT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src/components"
# Opening tag (no nested tags), then a newline + only whitespace, then closing tag
pattern = re.compile(r'[ \t]*<(span|div)\s+className=(?:"[^"]*"|\{`[^`]*`\})\s*>[ \t]*\r?\n\s*</\1>[ \t]*\r?\n')

total = 0
for fn in sorted(os.listdir(ROOT)):
    if not fn.endswith('.tsx'):
        continue
    p = os.path.join(ROOT, fn)
    s = open(p).read()
    new, n = pattern.subn('', s)
    if n:
        open(p, 'w').write(new)
        print(f"  ✅ {fn}: removed {n} empty badge(s)")
        total += n
print(f"\n🎯 Total: {total}")
