#!/usr/bin/env python3
"""Batch convert all remaining dark-mode Tailwind classes to light theme."""
import os
import re

PROJECT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src/components"

# Mapping: dark class -> light replacement
REPLACEMENTS = [
    # Backgrounds - dark to light
    ("bg-slate-950", "bg-white"),
    ("bg-slate-900/95", "bg-white/95"),
    ("bg-slate-900/80", "bg-white/80"),
    ("bg-slate-900", "bg-white"),
    ("bg-slate-800/80", "bg-slate-100/80"),
    ("bg-slate-800/60", "bg-slate-50"),
    ("bg-slate-800", "bg-slate-100"),
    ("bg-gray-950", "bg-slate-100"),
    ("bg-gray-900/60", "bg-slate-50"),
    ("bg-gray-900/80", "bg-white/80"),
    ("bg-gray-900/40", "bg-slate-50/40"),
    ("bg-gray-900", "bg-white"),
    ("bg-gray-800/80", "bg-slate-50"),
    ("bg-gray-800/40", "bg-slate-50"),
    ("bg-gray-800", "bg-slate-100"),
    ("bg-[#0f172a]", "bg-white"),
    ("bg-[#121620]", "bg-white"),
    
    # Borders - dark to light
    ("border-slate-800", "border-slate-200"),
    ("border-slate-700/60", "border-slate-200"),
    ("border-slate-700", "border-slate-200"),
    ("border-gray-800", "border-slate-200"),
    ("border-gray-700", "border-slate-300"),
    
    # Hover backgrounds
    ("hover:bg-slate-700", "hover:bg-slate-200"),
    ("hover:bg-slate-800", "hover:bg-slate-100"),
    ("hover:bg-gray-900/60", "hover:bg-slate-50"),
    ("hover:bg-gray-800/80", "hover:bg-slate-100"),
    ("hover:bg-gray-800/40", "hover:bg-slate-50"),
    ("hover:bg-gray-700", "hover:bg-slate-200"),
    ("hover:bg-gray-800", "hover:bg-slate-100"),
    
    # Hover borders
    ("hover:border-indigo-500/60", "hover:border-indigo-400"),
    ("hover:border-purple-500/60", "hover:border-purple-400"),
    ("hover:border-amber-500/60", "hover:border-amber-400"),
    ("hover:border-orange-500/40", "hover:border-orange-400"),
    ("hover:border-gray-700", "hover:border-slate-300"),
    
    # Text colors - light text on dark -> dark text on light
    ("text-gray-300", "text-slate-600"),
    ("text-gray-400", "text-slate-500"),
    ("text-gray-200", "text-slate-700"),
    ("text-slate-400", "text-slate-500"),
    ("text-slate-200", "text-slate-700"),
    ("text-orange-200", "text-orange-700"),
    
    # Hover text
    ("hover:text-white", "hover:text-slate-900"),
    
    # Special: emerald dark badge
    ("bg-emerald-950/60", "bg-emerald-50"),
    ("text-emerald-300", "text-emerald-700"),
    ("border-emerald-800/40", "border-emerald-200"),
    
    # Border-t special
    ("border-t border-orange-500/30", "border-t border-orange-200"),
]

files_to_fix = [
    "CoachCardOverlay.tsx",
    "PlanTab.tsx",
    "SocialAuditModal.tsx",
    "AdminPortal.tsx",
    "ExportDataModal.tsx",
    "OnboardingModal.tsx",
    "MethodLibraryModal.tsx",
    "PriorityMatrix.tsx",
    "AppearanceModal.tsx",
    "AchievementsTab.tsx",
]

total_changes = 0

for filename in files_to_fix:
    filepath = os.path.join(PROJECT, filename)
    if not os.path.exists(filepath):
        print(f"  SKIP {filename} (not found)")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    file_changes = 0
    
    for old, new in REPLACEMENTS:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            file_changes += count
    
    if file_changes > 0:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {filename}: {file_changes} replacements")
        total_changes += file_changes
    else:
        print(f"  ⏭️  {filename}: no changes needed")

print(f"\n🎯 Total: {total_changes} replacements across {len(files_to_fix)} files")
