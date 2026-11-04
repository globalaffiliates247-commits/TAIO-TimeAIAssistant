#!/usr/bin/env python3
"""Fix header sticky/safe-area + footer bottom spacing."""
SRC = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src"

def fix(path, pairs):
    p = f"{SRC}/{path}"
    s = open(p).read()
    for old, new in pairs:
        if old not in s:
            print(f"  ⚠️  {path}: target not found -> {old[:60]}")
            continue
        s = s.replace(old, new)
    open(p, 'w').write(s)
    print(f"  ✅ {path}")

# Root container: overflow-x-hidden breaks position:sticky -> use clip
fix("app/page.tsx", [
    ("""<div className={`min-h-screen flex flex-col bg-white text-slate-900 overflow-x-hidden w-full max-w-full ${deviceLook === 'phone' ? 'pb-24' : ''}`}>""",
     """<div style={{ overflowX: 'clip' }} className={`min-h-screen flex flex-col bg-white text-slate-900 w-full max-w-full ${deviceLook === 'phone' ? 'pb-24' : ''}`}>"""),
    ("""<footer className="border-t border-slate-200/80 py-5 text-center text-xs text-slate-500">""",
     """<footer style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} className="border-t border-slate-200/80 pt-4 px-4 text-center text-xs text-slate-500">"""),
])

# Body: same fix + disable iOS rubber-band overscroll gap
fix("app/layout.tsx", [
    ("""<html lang="vi">""",
     """<html lang="vi" style={{ backgroundColor: '#ffffff', overscrollBehavior: 'none' }}>"""),
    ("""<body className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden w-full max-w-full">""",
     """<body style={{ overflowX: 'clip', overscrollBehavior: 'none' }} className="min-h-screen bg-white text-slate-900 antialiased w-full max-w-full">"""),
])

# Header: overflow-x-hidden also clips the mobile dropdown menu
fix("components/Navbar.tsx", [
    ("""style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      className="sticky top-0 z-40 transition-colors duration-200 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs w-full max-w-full overflow-x-hidden\"""",
     """style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', overflowX: 'clip' }}
      className="sticky top-0 z-40 transition-colors duration-200 border-b border-slate-200 bg-white backdrop-blur-xl shadow-xs w-full max-w-full\""""),
])

# Nudge banner: hard-coded sticky top-[57px] overlaps header once safe-area padding applies
fix("components/ActionNudgeBanner.tsx", [
    (" shadow-xs sticky top-[57px] z-30 ", " shadow-xs "),
])
