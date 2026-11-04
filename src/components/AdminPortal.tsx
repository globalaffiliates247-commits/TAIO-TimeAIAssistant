'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROFILES } from '../data/mockData';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trash2, 
  TrendingUp, 
  Clock, 
  Sliders, 
  Volume2, 
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Bot,
  Check,
  X,
  FlaskConical,
  Zap,
  HelpCircle
} from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  profile: string;
  language: 'vi' | 'en';
  signupDate: string;
  lastActive: string;
  status: 'active' | 'suspended';
  onboardingTimeSec: number;
  checkInRate: number;
}

const MOCK_USERS: MockUser[] = [
  { id: 'u-1', name: 'Hoàng Minh (Founder)', email: 'founder@taio.club', profile: 'owner', language: 'vi', signupDate: '2026-10-15', lastActive: 'Vừa xong', status: 'active', onboardingTimeSec: 42, checkInRate: 94 },
  { id: 'u-2', name: 'Nguyễn Văn Nam', email: 'nam.tech@gmail.com', profile: 'technical', language: 'vi', signupDate: '2026-10-18', lastActive: '2 giờ trước', status: 'active', onboardingTimeSec: 38, checkInRate: 88 },
  { id: 'u-3', name: 'Trần Thu Thảo', email: 'thao.pm@company.vn', profile: 'manager', language: 'vi', signupDate: '2026-10-20', lastActive: 'Hôm qua', status: 'active', onboardingTimeSec: 51, checkInRate: 82 },
  { id: 'u-4', name: 'Lê Hoàng Anh', email: 'freelance.anh@design.co', profile: 'freelancer', language: 'en', signupDate: '2026-10-22', lastActive: '3 ngày trước', status: 'active', onboardingTimeSec: 45, checkInRate: 78 },
  { id: 'u-5', name: 'Đặng Tuấn Kiệt', email: 'kiet.sales@trade.vn', profile: 'trade', language: 'vi', signupDate: '2026-10-25', lastActive: '5 ngày trước', status: 'suspended', onboardingTimeSec: 58, checkInRate: 45 },
];

export const AdminPortal: React.FC = () => {
  const { setCurrentTab, openDrilldown, aiSuggestions, handleSuggestionAction } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'analytics' | 'c6_ai' | 'tone'>('analytics');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [usersList, setUsersList] = useState<MockUser[]>(MOCK_USERS);

  const toggleStatus = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
    }));
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProfile = profileFilter === 'all' || u.profile === profileFilter;
    return matchesSearch && matchesProfile;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('now')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            title="Quay lại ứng dụng người dùng"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">TAIO Admin Back-end</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-900/60 text-rose-300 border border-rose-700/50">
                Founder Portal v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị người dùng, thống kê hành vi ẩn danh và cấu hình giọng điệu thích ứng
            </p>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống kê (Analytics)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Người dùng (Users)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('c6_ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'c6_ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Cải tiến (PRD C6)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'tone' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Cấu hình giọng (Tone AI)</span>
          </button>
        </div>
      </div>

      {/* 1. Analytics Sub-Tab (PRD C3) */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Top Metric Cards with WYSIWYG Drilldown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div 
              onClick={() => openDrilldown({
                type: 'admin_stat',
                title: 'Chi tiết Onboarding < 60 giây',
                subtitle: 'Danh sách thời gian hoàn thành của 154 người dùng thử nghiệm',
                adminData: {
                  statKey: 'onboarding',
                  title: 'Tỷ lệ hoàn thành Onboarding dưới 60 giây',
                  total: '92.4% (142 / 154 người dùng)',
                  items: [
                    { label: 'Hoàng Minh (Founder)', detail: 'Hoàn thành hồ sơ Chủ doanh nghiệp trong 42 giây', badge: '42s' },
                    { label: 'Nguyễn Văn Nam', detail: 'Hoàn thành hồ sơ Chuyên gia kỹ thuật trong 38 giây', badge: '38s' },
                    { label: 'Trần Thu Thảo', detail: 'Hoàn thành hồ sơ Quản lý đa nhiệm trong 51 giây', badge: '51s' },
                    { label: 'Lê Hoàng Anh', detail: 'Hoàn thành hồ sơ Làm việc tự do trong 45 giây', badge: '45s' },
                    { label: 'Đặng Tuấn Kiệt', detail: 'Hoàn thành hồ sơ Thương mại & Dịch vụ trong 58 giây', badge: '58s' },
                    { label: 'Phạm Hồng Ánh', detail: 'Hoàn thành hồ sơ Hành chính trong 35 giây', badge: '35s' },
                  ]
                }
              })}
              className="bg-white border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
              title="Bấm để xem danh sách gốc đằng sau con số (WYSIWYG)"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 group-hover:text-indigo-300">Onboarding &lt; 60 giây</span>
                <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1">92.4%</p>
              <span className="text-[11px] text-gray-500">Trung bình 44 giây • Bấm xem gốc</span>
            </div>

            <div 
              onClick={() => openDrilldown({
                type: 'admin_stat',
                title: 'Chi tiết tỷ lệ phản hồi Check-in tự động',
                subtitle: 'Ghi nhận thời gian và lựa chọn sau khi khối kết thúc',
                adminData: {
                  statKey: 'checkin',
                  title: 'Tỷ lệ phản hồi Check-in sau khi kết thúc khối',
                  total: '86.7% phản hồi trong vòng 5 phút',
                  items: [
                    { label: 'User #101', detail: 'Xác nhận khối Tập trung sâu: Đã xong (Done) sau 12 giây', badge: 'Đã xong' },
                    { label: 'User #102', detail: 'Xác nhận khối Báo cáo: Xin thêm +15 phút sau 45 giây', badge: '+15p' },
                    { label: 'User #103', detail: 'Xác nhận khối Họp nhóm: Đã xong sau 8 giây', badge: 'Đã xong' },
                    { label: 'User #104', detail: 'Xác nhận Dừng tại đây & lưu điểm quay lại', badge: 'Dừng & lưu' },
                    { label: 'User #105', detail: 'Chưa phản hồi (Unconfirmed - đỗ tại Waiting for you)', badge: 'Chờ duyệt' },
                  ]
                }
              })}
              className="bg-white border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
              title="Bấm để xem danh sách gốc đằng sau con số (WYSIWYG)"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 group-hover:text-indigo-300">Tỷ lệ phản hồi Check-in</span>
                <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
              </div>
              <p className="text-2xl font-black text-indigo-400 mt-1">86.7%</p>
              <span className="text-[11px] text-gray-500">Tự động sau kết thúc • Bấm xem gốc</span>
            </div>

            <div 
              onClick={() => openDrilldown({
                type: 'admin_stat',
                title: 'Chi tiết tỷ lệ Đóng ngày (Day-close)',
                subtitle: 'Người dùng hoàn tất quy trình 2 phút và chọn việc số 1 ngày mai',
                adminData: {
                  statKey: 'dayclose',
                  title: 'Tỷ lệ đóng ngày và khóa tổng kết',
                  total: '78.1% (120 / 154 người dùng)',
                  items: [
                    { label: 'User #101 (Founder)', detail: 'Khóa ngày 21:30 • Việc mai: "Hoàn thiện thử nghiệm 14 ngày"', badge: 'Đã khóa' },
                    { label: 'User #102', detail: 'Khóa ngày 22:00 • Việc mai: "Review hợp đồng Minh"', badge: 'Đã khóa' },
                    { label: 'User #103', detail: 'Khóa ngày 21:45 • Việc mai: "Chốt danh sách khảo sát"', badge: 'Đã khóa' },
                    { label: 'User #104', detail: 'Khóa ngày 23:10 • Việc mai: "Quay clip #TAIOCLUB"', badge: 'Đã khóa' },
                  ]
                }
              })}
              className="bg-white border border-slate-200 hover:border-purple-400 hover:bg-slate-50 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
              title="Bấm để xem danh sách gốc đằng sau con số (WYSIWYG)"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 group-hover:text-purple-300">Tỷ lệ Đóng ngày</span>
                <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
              </div>
              <p className="text-2xl font-black text-purple-400 mt-1">78.1%</p>
              <span className="text-[11px] text-gray-500">Đã chọn việc mai • Bấm xem gốc</span>
            </div>

            <div 
              onClick={() => openDrilldown({
                type: 'admin_stat',
                title: 'Chi tiết việc gắn với Mục tiêu',
                subtitle: 'Tỷ lệ nhiệm vụ có mục tiêu phụng sự rõ ràng',
                adminData: {
                  statKey: 'tasks_goal',
                  title: 'Mức độ liên kết mục tiêu của nhiệm vụ',
                  total: '91.0% nhiệm vụ gắn liền với 1 trong 3-5 mục tiêu lớn',
                  items: [
                    { label: 'Mục tiêu Ra mắt TAIO MVP', detail: '58 khối công việc (Chiếm 41%)', badge: 'Mục tiêu 1' },
                    { label: 'Mục tiêu Kênh nội dung Brand Seeding', detail: '42 khối công việc (Chiếm 30%)', badge: 'Mục tiêu 2' },
                    { label: 'Mục tiêu Thể lực & Sức khỏe', detail: '28 khối công việc (Chiếm 20%)', badge: 'Mục tiêu 3' },
                    { label: 'Ngoài mục tiêu chính (Outside goals)', detail: '13 khối việc vặt phát sinh (Chiếm 9%)', badge: 'Việc vặt' },
                  ]
                }
              })}
              className="bg-white border border-slate-200 hover:border-amber-400 hover:bg-slate-50 rounded-xl p-4 transition-all cursor-pointer group shadow-sm"
              title="Bấm để xem danh sách gốc đằng sau con số (WYSIWYG)"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 group-hover:text-amber-300">Gắn với Mục tiêu</span>
                <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-1">91.0%</p>
              <span className="text-[11px] text-gray-500">Chỉ 9% ngoài mục tiêu • Bấm xem</span>
            </div>
          </div>

          {/* Profile Breakdown Chart with Clickable Bars */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  Phân bổ người dùng theo 6 hồ sơ khởi đầu (Onboarding Profile Distribution)
                </h3>
                <p className="text-xs text-indigo-400 mt-0.5">Bấm vào bất kỳ hồ sơ nào để xem danh sách tài khoản tương ứng ↗</p>
              </div>
              <span className="text-xs text-slate-500 font-semibold">154 tài khoản thử nghiệm</span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Chủ doanh nghiệp (Business Owner)', key: 'owner', count: 52, pct: 34, color: 'bg-indigo-500' },
                { name: 'Quản lý đa nhiệm (Multitasking Manager)', key: 'manager', count: 38, pct: 25, color: 'bg-purple-500' },
                { name: 'Chuyên gia kỹ thuật (Technical Specialist)', key: 'technical', count: 28, pct: 18, color: 'bg-sky-500' },
                { name: 'Làm việc tự do (Freelancer)', key: 'freelancer', count: 20, pct: 13, color: 'bg-amber-500' },
                { name: 'Hành chính & Hỗ trợ (Admin & Support)', key: 'admin', count: 11, pct: 7, color: 'bg-emerald-500' },
                { name: 'Thương mại & Dịch vụ (Trade & Service)', key: 'trade', count: 5, pct: 3, color: 'bg-rose-500' },
              ].map(item => (
                <div 
                  key={item.name} 
                  onClick={() => openDrilldown({
                    type: 'admin_stat',
                    title: `Danh sách người dùng hồ sơ: ${item.name}`,
                    subtitle: `Tổng cộng ${item.count} người (${item.pct}%)`,
                    adminData: {
                      statKey: item.key,
                      title: `Người dùng thuộc nhóm ${item.name}`,
                      total: `${item.count} tài khoản (${item.pct}%)`,
                      items: [
                        { label: `${item.name} #1`, detail: 'Hoạt động 2 giờ trước • Check-in rate: 92%', badge: 'Active' },
                        { label: `${item.name} #2`, detail: 'Hoạt động hôm qua • Check-in rate: 85%', badge: 'Active' },
                        { label: `${item.name} #3`, detail: 'Hoạt động 3 ngày trước • Check-in rate: 78%', badge: 'Active' },
                        { label: `${item.name} #4`, detail: 'Đã hoàn thành onboarding trong 40 giây', badge: 'Verified' },
                      ]
                    }
                  })}
                  className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  title={`Bấm để xem danh sách ${item.count} người dùng của hồ sơ này`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium group-hover:text-indigo-300 transition-colors">{item.name}</span>
                    <span className="text-slate-500">{item.count} người ({item.pct}%) ↗</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full group-hover:opacity-90 transition-opacity`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tone Response Rates (PRD B13 & C3) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              Tỷ lệ phản hồi check-in theo mức độ giọng điệu (Tone Response Rates)
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu tổng hợp ẩn danh giúp điều chỉnh bản mẫu hằng tuần.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs font-bold text-emerald-400 uppercase">Mức 1: Nhẹ nhàng (Gentle)</span>
                <p className="text-2xl font-bold text-white mt-1">89%</p>
                <p className="text-[11px] text-slate-500 mt-1">Phản hồi tốt nhất ở 3 ngày đầu tiên</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs font-bold text-indigo-400 uppercase">Mức 2: Rõ ràng (Clear)</span>
                <p className="text-2xl font-bold text-white mt-1">84%</p>
                <p className="text-[11px] text-slate-500 mt-1">Ổn định nhất cho người dùng tuần 2 trở đi</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs font-bold text-amber-400 uppercase">Mức 3: Dứt khoát (Firm)</span>
                <p className="text-2xl font-bold text-white mt-1">72%</p>
                <p className="text-[11px] text-slate-500 mt-1">Hiệu quả khi có hard deadline cận kề</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. User Management Sub-Tab (PRD C2) */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-500 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={profileFilter}
                onChange={e => setProfileFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả hồ sơ</option>
                {Object.values(PROFILES).map(p => (
                  <option key={p.type} value={p.type}>{p.title}</option>
                ))}
              </select>

              <button 
                onClick={() => alert('Xuất báo cáo CSV thành công (PRD C3)!')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Người dùng</th>
                    <th className="py-3 px-4">Hồ sơ</th>
                    <th className="py-3 px-4">Onboarding</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">
                        {PROFILES[u.profile]?.title || u.profile}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.onboardingTimeSec}s
                      </td>
                      <td className="py-3 px-4 text-indigo-400 font-bold">
                        {u.checkInRate}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {u.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium"
                        >
                          {u.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* C6. Super Admin AI Behavior Analytics & Improvement Suggestions */}
      {activeSubTab === 'c6_ai' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Banner */}
          <div className="p-5 bg-gradient-to-r from-indigo-950/70 via-gray-900 to-purple-950/60 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Phân tích Hành vi & Đề xuất Cải tiến AI (Super Admin)
                  <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    PRD C6
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Phát hiện điểm rơi hành vi toàn hệ thống • Đề xuất điều chỉnh mẫu câu và tham số mặc định • Có người duyệt trước khi áp dụng
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-600">
              Chế độ: <strong className="text-emerald-400">Human-in-the-loop</strong>
            </div>
          </div>

          {/* 1. Action Nudge Effectiveness Dashboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Hiệu quả Nhắc nhở Hành động (Action Nudge Acceptance Rate)</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">1 CTA • Tự biến mất • Lặp lại sau 10-15p</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-purple-300">Ngủ đúng giờ (Sleep Nudge)</span>
                  <span className="font-mono font-bold text-white">78%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '78%' }} />
                </div>
                <p className="text-[11px] text-slate-500">154 chấp thuận / 197 lần hiển thị. Tỷ lệ đóng app ngủ tăng 22%.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-emerald-700">Xuất phát ngay (Leave Now)</span>
                  <span className="font-mono font-bold text-white">82%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }} />
                </div>
                <p className="text-[11px] text-slate-500">89 chấp thuận / 108 cuộc hẹn có di chuyển. Giảm 85% trễ hẹn.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-indigo-300">Bắt đầu việc sâu (Start Deep)</span>
                  <span className="font-mono font-bold text-white">89%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '89%' }} />
                </div>
                <p className="text-[11px] text-slate-500">214 vào chế độ tập trung ngay trong 2 phút đầu giờ.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-amber-300">Đóng ngày (Close Day)</span>
                  <span className="font-mono font-bold text-white">91%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '91%' }} />
                </div>
                <p className="text-[11px] text-slate-500">310 khóa ngày & chọn việc số 1 cho ngày mai trước 22:30.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-cyan-300">Quay lại kế hoạch (Back to Plan)</span>
                  <span className="font-mono font-bold text-white">74%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
                <p className="text-[11px] text-slate-500">112 người dùng quay lại kế hoạch sau khi bị chệch hướng &gt;30p.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-rose-300">Nhắc nhở bữa ăn (Meal Nudge)</span>
                  <span className="font-mono font-bold text-white">86%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '86%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Giúp người dùng không bỏ bữa trưa và ăn tối đúng neo cá nhân.</p>
              </div>
            </div>
          </div>

          {/* 2. AI Improvement Suggestions List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Danh sách Đề xuất Cải tiến từ AI ({aiSuggestions.length})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI quét dữ liệu sử dụng ẩn danh của các nhóm hồ sơ để đưa ra đề xuất tối ưu tỷ lệ hoàn thành.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {aiSuggestions.map((sug) => {
                const isAccepted = sug.status === 'accepted';
                const isTesting = sug.status === 'testing';
                const isRejected = sug.status === 'rejected';

                return (
                  <div
                    key={sug.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{sug.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          {sug.category}
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Đã áp dụng
                          </span>
                        )}
                        {isTesting && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Đang chạy A/B Test (50% user)
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40 flex items-center gap-1">
                            <X className="w-3 h-3" /> Đã từ chối
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p><strong className="text-slate-500 font-normal">Bằng chứng dữ liệu:</strong> {sug.evidence}</p>
                        <p><strong className="text-indigo-400 font-normal">Hiệu quả kỳ vọng:</strong> {sug.expectedEffect}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {sug.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleSuggestionAction(sug.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => handleSuggestionAction(sug.id, 'test')}
                            className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <FlaskConical className="w-3.5 h-3.5" /> Chạy A/B Test
                          </button>
                          <button
                            onClick={() => handleSuggestionAction(sug.id, 'accept')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Chấp thuận
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSuggestionAction(sug.id, 'accept')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 text-xs"
                        >
                          Đặt lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 3. Tone of Voice Manager (PRD B13) */}
      {activeSubTab === 'tone' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Quản lý mẫu câu giọng điệu thích ứng (Adaptive Tone Templates)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin cấu hình mẫu câu mặc định (Constants) theo hồ sơ; AI trên máy chủ tối ưu trọng số (Variables) cho từng người.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase">Mẫu câu Mức 1: Nhẹ nhàng (Gentle)</span>
              <p className="text-xs text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                "Khối công việc vừa kết thúc êm đềm. Tiến độ của bạn diễn ra thế nào?"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase">Mẫu câu Mức 2: Rõ ràng (Clear)</span>
              <p className="text-xs text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                "Hiện là [Giờ]. Bạn đã hoàn thành [Tên việc] ([Thời gian], [Mục tiêu]) chưa? Chọn: Đã xong, Cần thêm giờ, hoặc Dừng."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase">Mẫu câu Mức 3: Dứt khoát (Firm)</span>
              <p className="text-xs text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                "[Tên việc] chưa xác nhận. Hạn chót kế tiếp [Tên hạn chót] sắp tới lúc [Giờ]. Xác nhận ngay để giữ cam kết."
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
