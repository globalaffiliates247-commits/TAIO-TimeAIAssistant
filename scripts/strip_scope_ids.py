#!/usr/bin/env python3
"""Strip PRD scope IDs (B5, C6.1, PRD v0.x...) from user-visible strings; keep code comments."""
import os, re

ROOT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src"
COMMENT = re.compile(r'^\s*(//|/\*|\*|\{/\*)')

RULES = [
    (re.compile(r'\s*\((?:PRD\s*)?(?:v0\.\d+(?:\.\d+)?\s*)?[BCD]\d{1,2}(?:\.\d)?\)'), ''),   # " (B25)", " (C6.1)"
    (re.compile(r'\s*\(PRD v0\.\d+(?:\.\d+)?\)'), ''),                                          # " (PRD v0.11)"
    (re.compile(r'\s+-\s+[BCD]\d{1,2}(?:\.\d)?\)'), ')'),                                       # "(xxx - B12)"
]
LITERALS = [
    ("Tập trung giải quyết code tính năng B28, B29, ", "Tập trung hoàn thiện các tính năng mới"),
    ("Đang viết mục B5 của spec", "Đang viết mục 5 của tài liệu"),
    ("note: 'B30 Active capture - ", "note: 'Active capture - "),
    ("Tính năng mới theo PRD v0.3.7", "Tính năng mới"),
    ("Làm giao diện B28/B29/B30", "Làm giao diện Thẻ nhắc việc"),
    ("bản nháp MVP v0.7 cho", "bản nháp MVP cho"),
]

total = 0
for dp, _, fns in os.walk(ROOT):
    for fn in fns:
        if not fn.endswith(('.ts', '.tsx')):
            continue
        p = os.path.join(dp, fn)
        lines = open(p).read().split('\n')
        n = 0
        for i, line in enumerate(lines):
            if COMMENT.match(line):
                continue
            new = line
            for old, rep in LITERALS:
                new = new.replace(old, rep)
            for rx, rep in RULES:
                new = rx.sub(rep, new)
            if new != line:
                lines[i] = new
                n += 1
        if n:
            open(p, 'w').write('\n'.join(lines))
            print(f"  ✅ {os.path.relpath(p, ROOT)}: {n} lines")
            total += n
print(f"\n🎯 Total: {total} lines cleaned")
