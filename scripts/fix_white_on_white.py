import re
ROOT = "src/components/"
rx = re.compile(r'className="([^"]*)"')
def fix_cls(m):
    c = m.group(1)
    if re.search(r'\btext-white\b', c) and not re.search(r'\bbg-(?!white|transparent|slate-(50|100))[a-z\[]', c):
        c = re.sub(r'\btext-white\b', 'text-slate-900', c)
    return f'className="{c}"'
for fn in ["AdminPortal.tsx", "OnboardingModal.tsx", "MethodLibraryModal.tsx"]:
    p = ROOT + fn; s = open(p).read(); n = rx.sub(fix_cls, s)
    open(p, 'w').write(n); print(fn, sum(1 for a, b in zip(s.split('\n'), n.split('\n')) if a != b), "lines")
p = ROOT + "SwipeReviewModal.tsx"; s = open(p).read()
s = s.replace("hover:bg-[#E0401F]/30 text-white flex flex-col", "hover:bg-[#E0401F]/25 text-[#E0401F] flex flex-col")
open(p, 'w').write(s)
