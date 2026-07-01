import React, { useState, useEffect } from 'react';
import { Compass, BarChart3, Settings, ShieldCheck, Mail, Users, FileSpreadsheet, Sparkles, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import { VKUser, Survey, AppSettings, BotLog, ReminderLog } from './types.js';

// Components
import AdminLogin from './components/AdminLogin.js';
import DashboardStats from './components/DashboardStats.js';
import SurveyList from './components/SurveyList.js';
import BotSimulator from './components/BotSimulator.js';
import BotLogs from './components/BotLogs.js';
import SettingsPanel from './components/SettingsPanel.js';
import HostingGuide from './components/HostingGuide.js';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasLoadedSuccessfully = React.useRef(false);
  
  // Dashboard Database States
  const [users, setUsers] = useState<VKUser[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    reminderTime1: '10:00',
    reminderTime2: '15:00',
    reminderTime3: '19:00',
    reminderTime4: '22:00',
    reminderDays: [1, 5],
    surveysUrl: 'https://tvoyhod.online/'
  });
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [vkConfigured, setVkConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'settings' | 'hosting'>('dashboard');

  // Load state from backend Express API with silent retries during startup
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response (server is still booting or routing is initializing)');
      }
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setSurveys(json.data.surveys);
        setLogs(json.data.logs);
        setSettings(json.data.settings);
        setReminderLogs(json.data.reminderLogs);
        setVkConfigured(json.data.vkConfigured);
        setLoading(false);
        hasLoadedSuccessfully.current = true;
      } else {
        throw new Error(json.error || 'Server error');
      }
    } catch (e: any) {
      console.warn("Временный сбой подключения к бэкенду (ожидание запуска сервера...):", e.message);
      if (!hasLoadedSuccessfully.current) {
        // Silently retry shortly until the backend is fully ready
        setTimeout(fetchState, 1500);
      }
    }
  };

  useEffect(() => {
    fetchState();
    // Poll logs every 10 seconds for real-time vibe
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSurvey = async (title: string, url: string, scheduledFor: string) => {
    try {
      const res = await fetch('/api/add-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, scheduledFor })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerReminder = async (surveyId: string, timeSlot: string) => {
    try {
      const res = await fetch('/api/trigger-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, timeSlot })
      });
      const data = await res.json();
      fetchState();
      return data;
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Сбой запроса рассылки' };
    }
  };

  const handleResetCompletions = async () => {
    try {
      const res = await fetch('/api/reset-completions', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
      return data;
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Сбой сброса статусов' };
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  // If not authenticated, render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] font-sans text-slate-200 relative overflow-hidden" id="login-screen-root">
        {/* Background Decorative Glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <header className="py-4 border-b border-slate-800 bg-[#030712]/80 backdrop-blur-xl shrink-0">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.4)] flex-shrink-0">
                НП
              </div>
              <span className="font-extrabold text-white tracking-tight text-lg">НеПропусти</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 relative">
          <AdminLogin onLogin={() => setIsAuthenticated(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-200 flex flex-col justify-between relative overflow-hidden" id="applet-main-root">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* 🧭 Top Navigation Header Banner */}
      <header className="border-b border-slate-800/80 bg-[#030712]/85 backdrop-blur-xl sticky top-0 z-40 shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-400/20">
              НП
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white tracking-tight text-lg">НеПропусти</h1>
                <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                  V2.0 Staging
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium font-mono tracking-wide">Сервис управления VK-ботом «Твой Ход» • трек «Определяю»</p>
            </div>
          </div>

          {/* Navigation Items Tab Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Статистика
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'simulator' 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Тест-Песочница
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" /> Настройки
            </button>
            <button
              onClick={() => setActiveTab('hosting')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'hosting' 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> На VPS 24/7
            </button>
          </div>

          {/* Logout controls */}
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 font-bold px-3 py-2 rounded-xl transition duration-200 cursor-pointer shrink-0"
          >
            Выйти <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 📁 Main Content Body Area */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 relative z-10">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4"></span>
            <p className="text-sm font-medium font-mono">Загрузка цифрового дашборда...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* RENDER ACTIVE TAB COMPONENT */}
            
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Statistics graphics & subscribers database list */}
                <DashboardStats 
                  users={users} 
                  surveys={surveys} 
                  reminderLogs={reminderLogs}
                  vkConfigured={vkConfigured} 
                  onDownloadCsv={handleDownloadCsv}
                />
                
                {/* Trigger actions & new survey loader */}
                <SurveyList 
                  onTriggerReminder={handleTriggerReminder}
                  onResetCompletions={handleResetCompletions}
                />
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Interactive mobile VK client bot simulator */}
                <BotSimulator onMessageSent={fetchState} />
                {/* Complete history console log scrolling logger */}
                <BotLogs 
                  logs={logs} 
                  onClear={handleClearLogs} 
                  onRefresh={fetchState} 
                  isLoading={loading}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={settings} 
                onSave={handleUpdateSettings} 
              />
            )}

            {activeTab === 'hosting' && (
              <HostingGuide />
            )}
          </div>
        )}
      </main>

      {/* 🔖 Footer Section */}
      <footer className="border-t border-slate-900 py-6 bg-[#030712]/40 shrink-0">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2 leading-relaxed">
          <span>© 2026 Всероссийский студенческий проект «Твой Ход» • Все права защищены.</span>
          <span className="font-semibold text-slate-400 font-mono">Система оповещений проекта «НеПропусти» трека «Определяю»</span>
        </div>
      </footer>

    </div>
  );
}
