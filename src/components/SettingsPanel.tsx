import React, { useState, useEffect } from 'react';
import { Settings, Save, Bell, Calendar, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types.js';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [time1, setTime1] = useState(settings.reminderTime1 || '10:00');
  const [time2, setTime2] = useState(settings.reminderTime2 || '15:00');
  const [time3, setTime3] = useState(settings.reminderTime3 || '19:00');
  const [time4, setTime4] = useState(settings.reminderTime4 || '22:00');
  const [surveysUrl, setSurveysUrl] = useState(settings.surveysUrl || 'https://tvoyhod.online/');
  const [selectedDays, setSelectedDays] = useState<number[]>(settings.reminderDays || [1, 5]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setTime1(settings.reminderTime1 || '10:00');
    setTime2(settings.reminderTime2 || '15:00');
    setTime3(settings.reminderTime3 || '19:00');
    setTime4(settings.reminderTime4 || '22:00');
    setSurveysUrl(settings.surveysUrl || 'https://tvoyhod.online/');
    setSelectedDays(settings.reminderDays || [1, 5]);
  }, [settings]);

  const toggleDay = (dayNum: number) => {
    setSelectedDays(prev => 
      prev.includes(dayNum) 
        ? prev.filter(d => d !== dayNum) 
        : [...prev, dayNum].sort()
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSave({
        reminderTime1: time1,
        reminderTime2: time2,
        reminderTime3: time3,
        reminderTime4: time4,
        reminderDays: selectedDays,
        surveysUrl: surveysUrl
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const DAYS_OF_WEEK = [
    { label: "Пн", value: 1 },
    { label: "Вт", value: 2 },
    { label: "Ср", value: 3 },
    { label: "Чт", value: 4 },
    { label: "Пт", value: 5 },
    { label: "Сб", value: 6 },
    { label: "Вс", value: 0 }
  ];

  return (
    <div className="glow-card rounded-3xl p-6" id="settings-card">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.15)]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white tracking-tight">Интервалы и параметры бота</h3>
          <p className="text-xs text-slate-400">Настройте расписание автоматической отправки оповещений</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Days Selectors */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Дни недели (выход новых опросов)
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const active = selectedDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border cursor-pointer transition duration-200 ${
                    active 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-mono">
            * Рекомендовано: Понедельник и Пятница. В эти дни бот проверяет появление заданий в 10:00 утра по Мск.
          </p>
        </div>

        {/* Reminder Timings slots */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3.5 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-cyan-400" /> Сетка напоминаний по часам (МСК)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-450 text-slate-300 block mb-1.5 font-semibold">1. Выход (10:00)</span>
              <input
                type="text"
                value={time1}
                onChange={(e) => setTime1(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900/20 rounded-xl px-3 py-2.5 text-xs outline-none font-bold text-white transition duration-200 font-mono"
              />
            </div>
            <div>
              <span className="text-xs text-slate-450 text-slate-300 block mb-1.5 font-semibold">2. Напоминание (15:00)</span>
              <input
                type="text"
                value={time2}
                onChange={(e) => setTime2(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900/20 rounded-xl px-3 py-2.5 text-xs outline-none font-bold text-white transition duration-200 font-mono"
              />
            </div>
            <div>
              <span className="text-xs text-slate-450 text-slate-300 block mb-1.5 font-semibold">3. Пуш 2 (19:00)</span>
              <input
                type="text"
                value={time3}
                onChange={(e) => setTime3(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900/20 rounded-xl px-3 py-2.5 text-xs outline-none font-bold text-white transition duration-200 font-mono"
              />
            </div>
            <div>
              <span className="text-xs text-slate-450 text-slate-300 block mb-1.5 font-semibold">4. Дедлайн (22:00)</span>
              <input
                type="text"
                value={time4}
                onChange={(e) => setTime4(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900/20 rounded-xl px-3 py-2.5 text-xs outline-none font-bold text-white transition duration-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Target URL details */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1">
            Ссылка на трек «Определяю»
          </label>
          <input
            type="url"
            value={surveysUrl}
            onChange={(e) => setSurveysUrl(e.target.value)}
            placeholder="https://tvoyhod.online/..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900/20 rounded-xl px-4 py-2.5 text-xs outline-none font-medium text-slate-300 transition duration-200 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Ссылка будет отправляться студентам в сообщениях с приглашением пройти опрос на платформе «Твой Ход».
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold h-5 font-mono">
            {savedSuccess && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Настройки успешно обновлены и сохранены
              </>
            )}
          </div>
          
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition disabled:opacity-50 cursor-pointer duration-200"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}
