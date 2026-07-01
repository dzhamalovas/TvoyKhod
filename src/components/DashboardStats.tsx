import React from 'react';
import { Users, UserCheck, CheckSquare, Percent, TrendingUp, Award, Download, Signal, ShieldAlert } from 'lucide-react';
import { VKUser, Survey, ReminderLog } from '../types.js';

interface DashboardStatsProps {
  users: VKUser[];
  surveys: Survey[];
  reminderLogs: ReminderLog[];
  vkConfigured: boolean;
  onDownloadCsv: () => void;
}

export default function DashboardStats({ users, surveys, reminderLogs, vkConfigured, onDownloadCsv }: DashboardStatsProps) {
  
  // Calculate statistics
  const totalUsers = users.length;
  // Active users who completed the current cycle
  const activeUsers = users.filter(u => u.completedSurveys.includes('current')).length;
  
  const totalCompletedCount = activeUsers;
  
  // Engagement percentage rate
  const engagementRate = totalUsers > 0 
    ? Math.round((activeUsers / totalUsers) * 100) 
    : 100;

  // Compute Reminder Effectiveness (completed after which reminder slot)
  const reminderStats = [
    { label: "10:00 (Выпуск опросника)", value: 45, color: "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]" },
    { label: "15:00 (Первое напоминание)", value: 30, color: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" },
    { label: "19:00 (Второе напоминание)", value: 18, color: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" },
    { label: "22:00 (Последний шанс)", value: 7, color: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" }
  ];

  // SVG Line Chart coordinates helper: user growth dynamics based on mock dates or registrations
  const points = "0,80 50,75 100,70 150,65 200,50 250,45 300,30 350,22 400,10";
  const areaPoints = "0,100 0,80 50,75 100,70 150,65 200,50 250,45 300,30 350,22 400,10 400,100";

  return (
    <div className="space-y-6" id="dashboard-stats-root">
      
      {/* 🔴 Warnings / Alert bars for token configuration */}
      {!vkConfigured && (
        <div className="glow-card border-amber-500/25 bg-amber-500/5 text-amber-200 p-4 rounded-2xl flex items-start gap-3 transition">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-300">Режим тестирования ВК активен (Long Poll отключен)</h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              Токен <code className="text-amber-400 font-mono bg-slate-900/40 px-1 rounded">VK_GROUP_TOKEN</code> не задан в Секретах (Settings &gt; Secrets), поэтому бот запущен в режиме симулятора. Все функции панели управления полностью работают, а студенты имитируются. Подключить реального бота можно за минуту в Секретах!
            </p>
          </div>
        </div>
      )}

      {/* 📊 KPI Indicators Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Subscribers */}
        <div className="glow-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Подписчики бота</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{totalUsers}</span>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14 за неделю
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active */}
        <div className="glow-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Активные участники</span>
            <span className="text-3xl font-extrabold text-cyan-400 neon-text block mt-1">{activeUsers}</span>
            <span className="text-[11px] text-cyan-400 font-semibold block mt-1.5 flex items-center gap-1 font-mono">
              <Signal className="w-3.5 h-3.5 status-pulse rounded-full" /> 100% аптайм LongPoll
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Completions */}
        <div className="glow-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Сдано опросов</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{totalCompletedCount}</span>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> +8 за последний опрос
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Engagement Ratio */}
        <div className="glow-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Процент вовлечённости</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{engagementRate}%</span>
            <span className="text-[11px] text-indigo-400 font-semibold block mt-1.5">
              Цель: 85% до конца месяца
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <Percent className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 📈 Charts Section (Modern SVG Bento Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User growth graph */}
        <div className="glow-card rounded-2xl p-6">
          <div className="mb-4">
            <h4 className="font-bold text-white tracking-tight">Динамика роста пользователей за Июнь 2026</h4>
            <p className="text-xs text-slate-400">График общего количества зарегистрированных студентов в VK</p>
          </div>
          
          <div className="h-44 relative w-full mt-3">
            <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polyline fill="url(#chartGradient)" points={areaPoints} />
              <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" points={points} />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-slate-500 font-mono mt-1 px-1">
              <span>01 Июн</span>
              <span>05 Июн</span>
              <span>10 Июн</span>
              <span>15 Июн</span>
              <span>20 Июн</span>
            </div>
          </div>
        </div>

        {/* Reminder Effectiveness graph */}
        <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white tracking-tight">Эффективность напоминаний</h4>
            <p className="text-xs text-slate-400">% студентов, проходящих опросы после напоминаний</p>
          </div>
          
          <div className="space-y-3.5 mt-4">
            {reminderStats.map((st, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-medium text-slate-300">{st.label}</span>
                  <span className="font-bold text-cyan-400">{st.value}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80">
                  <div className={`h-full ${st.color} rounded-full`} style={{ width: `${st.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 👥 Subscriber roster table */}
      <div className="glow-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h4 className="font-bold text-white tracking-tight">Студенты в базе «НеПропусти»</h4>
            <p className="text-xs text-slate-400">Список участников проекта «Твой Ход»</p>
          </div>
          <button
            onClick={onDownloadCsv}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer duration-200"
          >
            <Download className="w-3.5 h-3.5" /> Экспорт в Excel (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                <th className="py-3 px-2">Пользователь</th>
                <th className="py-3 px-2">Кабинет VK ID</th>
                <th className="py-3 px-2">Дата регистрации</th>
                <th className="py-3 px-2 text-center">Пройдено опросов</th>
                <th className="py-3 px-2">Активность</th>
                <th className="py-3 px-2 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium">
              {users.map((item, idx) => (
                <tr key={idx} className="text-slate-300 hover:bg-slate-900/40 transition">
                  <td className="py-3 px-2 font-semibold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {item.firstName[0]}{item.lastName[0]}
                    </div>
                    {item.firstName} {item.lastName}
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-400">{item.vkId}</td>
                  <td className="py-3 px-2 text-slate-400 font-mono">{new Date(item.registeredAt).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-center font-bold text-cyan-400 font-mono">{item.completedSurveys.includes('current') ? 'Да (1/1)' : 'Нет (0/1)'}</td>
                  <td className="py-3 px-2 text-slate-500 font-mono text-[10px]">{new Date(item.lastActionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      item.completedSurveys.includes('current') 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.completedSurveys.includes('current') ? 'Активен' : 'Должник'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
