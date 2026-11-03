'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Plus, 
  Lightbulb, 
  FolderKanban, 
  CheckSquare, 
  Pin, 
  Archive, 
  Search, 
  Calendar, 
  Clock, 
  Target, 
  ArrowRight,
  Sparkles,
  Check,
  ChevronRight,
  Hash
} from 'lucide-react';
import { ListType, IdeaState, ProjectStatus, ListItem } from '../types';

export const ListsModal: React.FC = () => {
  const { 
    lists, 
    listItems, 
    activeListId, 
    setActiveListId, 
    isListsModalOpen, 
    setIsListsModalOpen,
    createList,
    archiveList,
    togglePinList,
    addListItem,
    toggleListItemCheck,
    updateListItem,
    archiveListItem,
    goals
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<ListType>('idea');
  const [newListTag, setNewListTag] = useState('');
  
  // Expanded item for editing details
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');
  const [itemNextActionInput, setItemNextActionInput] = useState('');
  const [itemGoalIdInput, setItemGoalIdInput] = useState('');

  if (!isListsModalOpen) return null;

  const currentList = lists.find(l => l.id === activeListId) || lists.find(l => !l.archived) || lists[0];
  const activeLists = lists.filter(l => !l.archived).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const itemsOfCurrentList = listItems
    .filter(i => i.listId === currentList?.id && !i.archived)
    .filter(i => !searchQuery || i.text.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !currentList) return;
    addListItem(currentList.id, quickInput.trim(), {
      source: 'typed',
      goalId: currentList.type === 'project' ? goals[0]?.id : undefined,
    });
    setQuickInput('');
  };

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const createdId = createList(newListName.trim(), newListType, newListTag.trim() || undefined);
    setNewListName('');
    setNewListTag('');
    setIsCreatingList(false);
    setActiveListId(createdId);
  };

  const formatDateDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type: ListType) => {
    switch (type) {
      case 'idea':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-sky-400" />;
      case 'checklist':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getTypeNameVi = (type: ListType) => {
    switch (type) {
      case 'idea': return 'Ý tưởng';
      case 'project': return 'Dự án';
      case 'checklist': return 'Checklist';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Danh sách</h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#E0401F]/20 text-[#ff7556] border border-[#E0401F]/30">
                  Mini App B26
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ý tưởng (Idea), Dự án (Project) và Checklist – Chụp nhanh dưới 5 giây
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsListsModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar (Lists) + Main Area (Items) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Lists Navigation */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-900/40 p-3 sm:p-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Các danh sách ({activeLists.length})
              </span>
              <button
                onClick={() => setIsCreatingList(true)}
                className="text-xs font-medium text-[#ff7556] hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo mới</span>
              </button>
            </div>

            {/* List of AppLists */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-40 md:max-h-full pr-1">
              {activeLists.map(lst => {
                const isSelected = lst.id === currentList?.id;
                const count = listItems.filter(i => i.listId === lst.id && !i.archived).length;
                return (
                  <div
                    key={lst.id}
                    onClick={() => { setActiveListId(lst.id); setIsCreatingList(false); }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#E0401F]/15 border-[#E0401F]/40 text-white shadow-sm'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        {getTypeIcon(lst.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-medium truncate">{lst.name}</p>
                          {lst.pinned && <Pin className="w-2.5 h-2.5 text-amber-400 shrink-0 fill-amber-400" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{getTypeNameVi(lst.type)}</span>
                          {lst.tag && <span className="text-slate-500">{lst.tag}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-700/50">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active List View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
            
            {isCreatingList ? (
              /* Create New List Form */
              <div className="p-6 overflow-y-auto space-y-6 max-w-lg mx-auto w-full">
                <div>
                  <h3 className="text-base font-bold text-white">Tạo danh sách mới</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chọn 1 trong 3 mẫu cố định theo PRD B26 để giữ trọn vẹn tốc độ đơn giản:
                  </p>
                </div>

                <form onSubmit={handleCreateListSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tên danh sách</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ý tưởng Kịch bản Video AI, Dự án Website MVP..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E0401F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Loại danh sách (Không thể đổi sau khi tạo)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewListType('idea')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          newListType === 'idea' 
                            ? 'bg-[#E0401F]/15 border-[#E0401F] text-white' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-slate-200">Ý tưởng</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Sticky-note, ghi chú, trạng thái New / Considering / Used
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewListType('project')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          newListType === 'project' 
                            ? 'bg-[#E0401F]/15 border-[#E0401F] text-white' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <FolderKanban className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-bold text-slate-200">Dự án</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Gắn Goal, hạn chót, % tiến độ & Next Action (GTD)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewListType('checklist')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          newListType === 'checklist' 
                            ? 'bg-[#E0401F]/15 border-[#E0401F] text-white' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-200">Checklist</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Mua sắm, chuẩn bị đồ, 1 chạm gạch ngang xong
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Mã tag Telegram / Widget (Tùy chọn)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">#</span>
                      <input
                        type="text"
                        placeholder="ytuong, duan, shopping..."
                        value={newListTag.replace(/^#/, '')}
                        onChange={(e) => setNewListTag(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E0401F]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Gửi tin nhắn Telegram kèm tag này sẽ tự bay thẳng vào danh sách.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreatingList(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#E0401F] hover:bg-[#c83515] rounded-xl shadow-lg shadow-red-500/25 transition-all"
                    >
                      Tạo danh sách
                    </button>
                  </div>
                </form>
              </div>
            ) : currentList ? (
              /* Items of Selected List */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Active List Top Bar */}
                <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-white">
                      {getTypeIcon(currentList.type)}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">{currentList.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{getTypeNameVi(currentList.type)}</span>
                        <span>•</span>
                        <span>Cập nhật: {formatDateDisplay(currentList.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for current list */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePinList(currentList.id)}
                      title={currentList.pinned ? 'Bỏ ghim' : 'Ghim danh sách'}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        currentList.pinned 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => archiveList(currentList.id)}
                      title="Lưu trữ danh sách"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-amber-400 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 1-Line Quick Add Bar (B26: "Add an item in one line from the top. Enter = saved") */}
                <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60">
                  <form onSubmit={handleQuickAdd} className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={`+ Thêm mục mới vào "${currentList.name}" (Nhấn Enter để lưu)...`}
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E0401F] pr-20"
                    />
                    <button
                      type="submit"
                      disabled={!quickInput.trim()}
                      className="absolute right-2 px-3 py-1.5 rounded-lg bg-[#E0401F] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c83515] transition-all"
                    >
                      Lưu
                    </button>
                  </form>
                </div>

                {/* Items List Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                  {itemsOfCurrentList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <p className="text-sm">Chưa có mục nào trong danh sách này.</p>
                      <p className="text-xs text-slate-600 mt-1">Gõ 1 dòng ở trên và nhấn Enter để chụp nhanh!</p>
                    </div>
                  ) : (
                    itemsOfCurrentList.map(item => {
                      if (currentList.type === 'checklist') {
                        // 1. Simple Checklist Layout
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              item.checked 
                                ? 'bg-slate-900/30 border-slate-800/60 text-slate-500' 
                                : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div 
                              onClick={() => toggleListItemCheck(item.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1"
                            >
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                item.checked 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-600 hover:border-slate-400'
                              }`}>
                                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className={`text-xs sm:text-sm font-medium ${item.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {item.text}
                              </span>
                            </div>
                            <button
                              onClick={() => archiveListItem(item.id)}
                              className="text-slate-500 hover:text-slate-300 p-1"
                              title="Lưu trữ"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      } else if (currentList.type === 'idea') {
                        // 2. Idea List Layout (Sticky-note lines, state chips, dates on right)
                        return (
                          <div
                            key={item.id}
                            className="p-3 sm:p-3.5 rounded-xl border bg-slate-900/80 border-slate-800/90 hover:border-slate-700 transition-all space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs sm:text-sm font-semibold text-slate-100 flex-1 leading-snug">
                                {item.text}
                              </p>
                              {/* Dates small on right (PRD: 'ghi 03/11 · sửa 05/11') */}
                              <span className="text-[10px] text-slate-500 shrink-0">
                                ghi {formatDateDisplay(item.createdAt)}
                                {item.updatedAt !== item.createdAt && ` · sửa ${formatDateDisplay(item.updatedAt)}`}
                              </span>
                            </div>

                            {item.note && (
                              <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                                {item.note}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 text-xs">
                              {/* State Selector */}
                              <div className="flex items-center gap-1.5">
                                {(['new', 'considering', 'used', 'dropped'] as IdeaState[]).map(st => {
                                  const isCurrentState = (item.ideaState || 'new') === st;
                                  const labelVi = st === 'new' ? 'Mới' : st === 'considering' ? 'Đang xét' : st === 'used' ? 'Đã dùng' : 'Đã bỏ';
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => updateListItem(item.id, { ideaState: st })}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${
                                        isCurrentState
                                          ? st === 'used' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : st === 'considering' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                            : st === 'dropped' ? 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                            : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                                          : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                                      }`}
                                    >
                                      {labelVi}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => archiveListItem(item.id)}
                                className="text-slate-500 hover:text-slate-300 p-1"
                                title="Lưu trữ"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      } else {
                        // 3. Project List Layout (Cards with goal chip, deadline, progress bar, GTD next action)
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border bg-slate-900/90 border-slate-800 hover:border-slate-700/80 transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{item.text}</h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.goalName && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                                      <Target className="w-2.5 h-2.5" />
                                      {item.goalName}
                                    </span>
                                  )}
                                  {item.deadline && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5" />
                                      Hạn: {item.deadline}
                                    </span>
                                  )}
                                  {item.timeSpentMinutes !== undefined && item.timeSpentMinutes > 0 && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      Đã dành: {item.timeSpentMinutes}p
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                                item.projectStatus === 'active' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' :
                                item.projectStatus === 'done' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {item.projectStatus === 'active' ? 'Đang chạy' : item.projectStatus === 'done' ? 'Hoàn thành' : 'Kế hoạch'}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Tiến độ</span>
                                <span className="font-semibold text-white">{item.progress || 0}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#E0401F] to-amber-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${item.progress || 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Next action (GTD) */}
                            {item.nextAction && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                                <ArrowRight className="w-3.5 h-3.5 text-[#ff7556] shrink-0" />
                                <span className="text-slate-300 truncate">
                                  <strong>Kế tiếp (GTD):</strong> {item.nextAction}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
