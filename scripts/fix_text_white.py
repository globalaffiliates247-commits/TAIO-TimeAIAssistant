#!/usr/bin/env python3
"""Fix text-white on now-white backgrounds and other remnants."""
import os

PROJECT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src/components"

# These files have text-white on containers/elements that are now white background
# Need to be careful - only fix text-white that's NOT on colored buttons/badges

fixes = {
    "CoachCardOverlay.tsx": [
        # Coach card overlay - now white bg, text should be dark
        ('text-white space-y-2.5">', 'text-slate-800 space-y-2.5">'),
    ],
    "SocialAuditModal.tsx": [
        # Main container text
        ('text-white">', 'text-slate-800">'),
    ],
    "SwipeReviewModal.tsx": [
        # Input field text color
        ('rounded-lg p-2 text-xs text-white"', 'rounded-lg p-2 text-xs text-slate-800"'),
        # hover states on light bg buttons
        ('text-slate-500 hover:text-white"', 'text-slate-500 hover:text-slate-800"'),
        ('hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"', 
         'hover:text-slate-900 flex flex-col items-center justify-center gap-1 transition-all group"'),
        # The red button action area - keep text-white there (it has bg-[#E0401F])
        # Don't touch those
    ],
    "ReminderQuestionsModal.tsx": [
        # heading text on modal
        ('text-sm sm:text-base font-bold text-white pt-1', 
         'text-sm sm:text-base font-bold text-slate-800 pt-1'),
        ('text-slate-500 hover:text-white p-2', 
         'text-slate-500 hover:text-slate-800 p-2'),
        ('text-slate-500 hover:text-white hover:bg-slate-100', 
         'text-slate-500 hover:text-slate-800 hover:bg-slate-100'),
    ],
    "OnboardingModal.tsx": [
        # Unselected state - was bg-gray-800 text-gray-300, now bg-slate-100 
        ("'bg-slate-100 text-slate-600'", "'bg-slate-100 text-slate-600'"),
        # Main text - check for white on white
        ("text-white text-sm focus:outline-none", "text-slate-800 text-sm focus:outline-none"),
    ],
}

total = 0
for filename, replacements in fixes.items():
    filepath = os.path.join(PROJECT, filename)
    if not os.path.exists(filepath):
        print(f"  SKIP {filename}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    count = 0
    for old, new in replacements:
        c = content.count(old)
        if c > 0:
            content = content.replace(old, new)
            count += c
    
    if count > 0:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {filename}: {count} fixes")
        total += count
    else:
        print(f"  ⏭️  {filename}: no matches")

print(f"\n🎯 Total: {total} text-white fixes")
