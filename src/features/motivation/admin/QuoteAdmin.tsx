// TAIO Time App — Quote Admin Panel (PRD FEATURE v0.3.31 Part E.2)
'use client';

import React, { useState, useMemo } from 'react';
import {
  MotivationQuote,
  QuoteContext,
} from '../model/types';
import {
  BUILTIN_QUOTES,
  loadServerQuotesCache,
  saveServerQuotesCache,
} from '../model/motivationStore';
import {
  Search,
  Plus,
  Filter,
  Check,
  X,
  Edit2,
  Eye,
  ListPlus,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const CONTEXT_OPTIONS: { id: QuoteContext; label: string }[] = [
  { id: 'start_day', label: 'Bắt đầu ngày (start_day)' },
  { id: 'start_task', label: 'Bắt đầu việc (start_task)' },
  { id: 'break', label: 'Nghỉ ngơi / Trống (break)' },
  { id: 'done', label: 'Hoàn thành việc (done)' },
  { id: 'end_day', label: 'Chốt ngày (end_day)' },
  { id: 'goal', label: 'Mục tiêu (goal)' },
  { id: 'any', label: 'Mọi lúc (any)' },
];

export const QuoteAdmin: React.FC = () => {
  const [quotes, setQuotes] = useState<MotivationQuote[]>(() => {
    const cached = loadServerQuotesCache();
    if (cached.length > 0) return cached;
    return BUILTIN_QUOTES;
  });

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'vi' | 'en'>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);

  // Modal / Form state for Add or Edit
  const [editingQuote, setEditingQuote] = useState<MotivationQuote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Form fields
  const [formText, setFormText] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formLang, setFormLang] = useState<'vi' | 'en'>('vi');
  const [formContexts, setFormContexts] = useState<QuoteContext[]>(['start_day']);
  const [formKeywords, setFormKeywords] = useState('');
  const [formWeight, setFormWeight] = useState<number>(1);
  const [formActive, setFormActive] = useState(true);
  const [formVerified, setFormVerified] = useState(false);

  // Sync to local cache
  const persistQuotes = (updated: MotivationQuote[]) => {
    setQuotes(updated);
    saveServerQuotesCache(updated);
  };

  const openAddForm = () => {
    setEditingQuote(null);
    setFormText('');
    setFormAuthor('');
    setFormLang('vi');
    setFormContexts(['start_day']);
    setFormKeywords('');
    setFormWeight(1);
    setFormActive(true);
    setFormVerified(false);
    setShowForm(true);
  };

  const openEditForm = (q: MotivationQuote) => {
    setEditingQuote(q);
    setFormText(q.text);
    setFormAuthor(q.author || '');
    setFormLang(q.lang);
    setFormContexts(q.contexts);
    setFormKeywords((q.goalKeywords || []).join(', '));
    setFormWeight(q.weight || 1);
    setFormActive(q.active);
    setFormVerified(Boolean(q.verified));
    setShowForm(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const keywords = formKeywords
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingQuote) {
      // Update
      const updated = quotes.map(q => {
        if (q.id !== editingQuote.id) return q;
        return {
          ...q,
          text: formText.trim(),
          author: formAuthor.trim() || undefined,
          lang: formLang,
          contexts: (formContexts.length ? formContexts : (['any'] as QuoteContext[])),
          goalKeywords: keywords.length ? keywords : undefined,
          weight: formWeight,
          active: formActive,
          verified: formVerified,
          updatedAt: new Date().toISOString(),
        };
      });
      persistQuotes(updated);
    } else {
      // Create new
      const newQuote: MotivationQuote = {
        id: `server-${Date.now()}`,
        text: formText.trim(),
        author: formAuthor.trim() || undefined,
        lang: formLang,
        contexts: (formContexts.length ? formContexts : (['any'] as QuoteContext[])),
        goalKeywords: keywords.length ? keywords : undefined,
        weight: formWeight,
        active: formActive,
        source: 'taio',
        verified: formVerified,
        updatedAt: new Date().toISOString(),
      };
      persistQuotes([newQuote, ...quotes]);
    }

    setShowForm(false);
  };

  const toggleQuoteActive = (id: string) => {
    const updated = quotes.map(q => {
      if (q.id !== id) return q;
      return { ...q, active: !q.active, updatedAt: new Date().toISOString() };
    });
    persistQuotes(updated);
  };

  // Bulk import (Part E.2: Dán danh sách, mỗi dòng 1 câu, tác giả sau dấu " - ")
  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems: MotivationQuote[] = [];

    lines.forEach((line, idx) => {
      let text = line;
      let author = '';
      if (line.includes(' - ')) {
        const parts = line.split(' - ');
        text = parts[0].trim();
        author = parts.slice(1).join(' - ').trim();
      }

      newItems.push({
        id: `bulk-${Date.now()}-${idx}`,
        text,
        author: author || undefined,
        lang: 'vi',
        contexts: ['start_day', 'start_task'],
        weight: 1,
        active: true,
        source: 'taio',
        verified: false,
        updatedAt: new Date().toISOString(),
      });
    });

    persistQuotes([...newItems, ...quotes]);
    setShowBulkModal(false);
    setBulkText('');
  };

  // Filtered quotes list
  const filtered = useMemo(() => {
    return quotes.filter(q => {
      if (search) {
        const query = search.toLowerCase();
        const matchText = q.text.toLowerCase().includes(query);
        const matchAuthor = (q.author || '').toLowerCase().includes(query);
        if (!matchText && !matchAuthor) return false;
      }
      if (langFilter !== 'all' && q.lang !== langFilter) return false;
      if (statusFilter === 'active' && !q.active) return false;
      if (statusFilter === 'inactive' && q.active) return false;
      if (unverifiedOnly && q.verified) return false;
      if (contextFilter !== 'all') {
        if (!q.contexts.includes(contextFilter as QuoteContext) && !q.contexts.includes('any')) {
          return false;
        }
      }
      return true;
    });
  }, [quotes, search, langFilter, statusFilter, unverifiedOnly, contextFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E0401F]" />
            <span>Kho câu truyền động lực (Quản trị viên)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý kho câu xuất hiện trên tờ Ghi nhanh, Đồng hồ, Thẻ hết giờ và Màn hình chuông
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ListPlus size={14} />
            <span>Nhập danh sách</span>
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E0401F] hover:bg-[#c73416] text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Thêm câu mới</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, tác giả..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Lang filter */}
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value as any)}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none"
        >
          <option value="all">Ngôn ngữ: Tất cả</option>
          <option value="vi">Tiếng Việt (vi)</option>
          <option value="en">Tiếng Anh (en)</option>
        </select>

        {/* Context filter */}
        <select
          value={contextFilter}
          onChange={e => setContextFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none"
        >
          <option value="all">Ngữ cảnh: Tất cả</option>
          {CONTEXT_OPTIONS.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Unverified toggle button */}
        <button
          onClick={() => setUnverifiedOnly(!unverifiedOnly)}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            unverifiedOnly
              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert size={13} className={unverifiedOnly ? 'text-amber-700' : 'text-slate-400'} />
          <span>Chưa kiểm chứng ({quotes.filter(q => !q.verified).length})</span>
        </button>
      </div>

      {/* Quotes Count & List */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 px-1">
          Hiển thị {filtered.length} / {quotes.length} câu
        </div>

        <div className="space-y-2.5">
          {filtered.map(q => (
            <div
              key={q.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                q.active
                  ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-sm font-normal text-slate-900 italic">
                  "{q.text}"
                </div>

                <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500">
                  {q.author && (
                    <span className="font-semibold text-slate-700 not-italic">
                      — {q.author}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600 uppercase">
                    {q.lang}
                  </span>
                  {q.verified ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 text-[10px]">
                      <ShieldCheck size={11} />
                      <span>Đã kiểm chứng</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-amber-600 text-[10px]">
                      <ShieldAlert size={11} />
                      <span>Chưa kiểm chứng</span>
                    </span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="text-[10.5px]">
                    {q.contexts.join(', ')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openEditForm(q)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Sửa câu"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => toggleQuoteActive(q.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    q.active
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={q.active ? 'Đang bật (bấm để tắt)' : 'Đang tắt (bấm để bật)'}
                >
                  {q.active ? 'Bật' : 'Tắt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add / Edit Quote */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {editingQuote ? 'Chỉnh sửa câu truyền động lực' : 'Thêm câu truyền động lực mới'}
              </h4>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung câu nói *</label>
                <textarea
                  required
                  rows={3}
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  placeholder="Nhập nội dung truyền cảm hứng..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tác giả (nếu có)</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    placeholder="VD: Albert Einstein, Lão Tử..."
                    className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngôn ngữ</label>
                  <select
                    value={formLang}
                    onChange={e => setFormLang(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Context multi-select */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ngữ cảnh hiển thị</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONTEXT_OPTIONS.map(c => {
                    const checked = formContexts.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer transition-colors ${
                          checked ? 'bg-orange-50/80 border-[#E0401F] text-[#E0401F] font-bold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormContexts([...formContexts, c.id]);
                            } else {
                              setFormContexts(formContexts.filter(x => x !== c.id));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Goal Keywords */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Từ khóa mục tiêu liên quan (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={e => setFormKeywords(e.target.value)}
                  placeholder="VD: học, study, sách, thể thao, chạy bộ..."
                  className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Checkboxes: Verified & Active */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formVerified}
                    onChange={e => setFormVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E0401F]"
                  />
                  <span className="font-semibold text-slate-800">Đã kiểm chứng tác giả</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="font-semibold text-slate-800">Kích hoạt</span>
                </label>
              </div>

              {/* Live Preview (Part E.2: Xem trước 3 cỡ line, note, card) */}
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Eye size={12} />
                  <span>Xem trước (Preview)</span>
                </div>

                {/* Line preview */}
                <div className="p-2 rounded bg-white text-[11px] italic truncate border border-slate-200 text-slate-700">
                  "{formText || 'Nội dung câu nói...'}" {formAuthor && <span className="not-italic text-slate-400">— {formAuthor}</span>}
                </div>

                {/* Note preview */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs italic text-slate-800">
                  <div className="line-clamp-2">"{formText || 'Nội dung câu nói...'}"</div>
                  {formAuthor && <div className="text-right text-[10px] text-slate-400 not-italic mt-1">— {formAuthor}</div>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#c73416] text-white font-bold shadow-xs"
                >
                  Lưu câu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Nhập danh sách câu truyền động lực
              </h4>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Dán danh sách câu nói, mỗi câu một dòng. Nếu có tác giả, đặt sau dấu <strong>" - "</strong>.
              <br />
              <em>Ví dụ: Hành trình vạn dặm bắt đầu từ một bước chân - Lão Tử</em>
            </div>

            <textarea
              rows={6}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="Dán nội dung vào đây..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#E0401F] font-mono"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#c73416] disabled:opacity-40 text-white font-bold text-xs shadow-xs"
              >
                Nhập vào kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
