import os

file_path = '/Users/abc/.gemini/antigravity/scratch/taio-time-app/src/components/Navbar.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Locate from '{/* Action Controls */}' to the closing '</div>\n      </div>' before '{/* 4 Core Tabs Bar'
start_marker = '{/* Action Controls */}'
end_marker = '{/* 4 Core Tabs Bar with Native App Store Style */}'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f'Error: markers not found. start={start_idx}, end={end_idx}')
    exit(1)

# Find the div closing before end_marker
sub = text[start_idx:end_idx]
print(f'Found section to replace, length {len(sub)}')

replacement = """{/* Mobile Action Controls (< md): Only Quick Palette + Clean Menu Hamburger */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={togglePalette}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs border shadow-xs transition-all ${
              isCool
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-[#E0401F] border-red-200'
            }`}
            title="Đổi tông màu Lạnh / Nóng"
          >
            <span>{isCool ? '❄️ Lạnh' : '🔥 Nóng'}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 relative transition-all"
            aria-label="Mở công cụ"
          >
            {mobileMenuOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {inbox.filter(i => i.status === 'inbox').length > 0 && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`} />
            )}
          </button>
        </div>

        {/* Desktop / Tablet Action Controls (>= md): Full Toolbar */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs flex-wrap justify-end">
          {/* Quick Palette Toggle Button */}
          <button
            onClick={togglePalette}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all border shadow-xs ${
              isCool
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-red-50 hover:bg-red-100 text-[#E0401F] border-red-200'
            }`}
            title="Bấm để chuyển nhanh giữa Tông màu Lạnh (Xanh) và Tông màu Nóng (Đỏ)"
          >
            <span>{isCool ? '❄️ Tông Lạnh' : '🔥 Tông Nóng'}</span>
          </button>

          {/* Data Export for AI Assistant Button (PRD B24) */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Xuất dữ liệu Markdown cho AI Assistant (B24)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất AI</span>
          </button>

          {/* Inbox Mini App Button (PRD B20) */}
          <button
            onClick={() => setInboxModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold relative"
            title="Rổ công việc (Inbox - GTD B20)"
          >
            <Inbox className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Rổ việc</span>
            {inbox.filter(i => i.status === 'inbox').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}>
                {inbox.filter(i => i.status === 'inbox').length}
              </span>
            )}
          </button>

          {/* Lists Mini App Button (PRD B26) */}
          <button
            onClick={() => setIsListsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Danh sách Ý tưởng, Dự án, Checklist (B26)"
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-600" />
            <span>Danh sách</span>
          </button>

          {/* Swipe Review Backlog Button (PRD B28) */}
          <button
            onClick={() => setIsSwipeModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-200 transition-all font-semibold"
            title="Thẻ nhắc việc: Lướt rổ tồn đọng (B28)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Lướt rổ</span>
          </button>

          {/* Active Capture & Backfill (PRD B30) */}
          <button
            onClick={() => setIsActiveCaptureOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all font-semibold"
            title="Thu thập chủ động & Ghi bù (B30)"
          >
            <Clock className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Ghi bù</span>
          </button>

          {/* Tone of Voice Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={toneLevel}
              onChange={(e) => setToneLevel(e.target.value === 'auto' ? 'auto' : Number(e.target.value) as any)}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value={1}>Giọng: Nhẹ nhàng (Lv1)</option>
              <option value={2}>Giọng: Rõ ràng (Lv2)</option>
              <option value={3}>Giọng: Dứt khoát (Lv3)</option>
              <option value="auto">Giọng: Tự thích ứng (AI)</option>
            </select>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
            <User className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <select
              value={profile.type}
              onChange={(e) => {
                const targetKey = e.target.value;
                if (PROFILES[targetKey]) {
                  setProfile(PROFILES[targetKey]);
                }
              }}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {Object.values(PROFILES).map((p) => (
                <option key={p.type} value={p.type}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Appearance Settings Gear Icon (PRD B17) */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            title="Cài đặt giao diện & nền tảng"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Giao diện</span>
          </button>

          {/* Profile & Community Button (PRD B27) */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white font-semibold transition-all shadow-xs ${
              isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
            }`}
            title="Hồ sơ cá nhân (B27)"
          >
            <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
              {userProfileDetail.displayName.charAt(0) || 'U'}
            </div>
            <span>Cá nhân</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Tools Drawer (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-2xl px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <button
              onClick={() => { setInboxModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2">
                <Inbox className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                <span>Rổ việc (Inbox)</span>
              </div>
              {inbox.filter(i => i.status === 'inbox').length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`}>
                  {inbox.filter(i => i.status === 'inbox').length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setIsActiveCaptureOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <Clock className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <span>Ghi bù thời gian</span>
            </button>

            <button
              onClick={() => { setIsListsModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <FolderKanban className="w-4 h-4 text-sky-600" />
              <span>Danh sách</span>
            </button>

            <button
              onClick={() => { setIsSwipeModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-amber-700"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Lướt rổ việc</span>
            </button>

            <button
              onClick={() => { setExportModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Xuất AI Markdown</span>
            </button>

            <button
              onClick={() => { setSettingsModalOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Giao diện & Nền tảng</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {/* Profile Switcher */}
            <div className="flex items-center gap-1.5 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <User className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <select
                value={profile.type}
                onChange={(e) => {
                  const targetKey = e.target.value;
                  if (PROFILES[targetKey]) setProfile(PROFILES[targetKey]);
                }}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none w-full"
              >
                {Object.values(PROFILES).map((p) => (
                  <option key={p.type} value={p.type}>{p.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setIsProfileModalOpen(true); setMobileMenuOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-semibold text-xs shadow-xs ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[9px] font-black">
                {userProfileDetail.displayName.charAt(0) || 'U'}
              </div>
              <span>Cá nhân</span>
            </button>
          </div>
        </div>
      )}

      """

new_text = text[:start_idx] + replacement + text[end_idx:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Navbar successfully refactored!")
