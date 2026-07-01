import React, { useState } from 'react';
import { Play, Send, RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface SurveyListProps {
  onTriggerReminder: (surveyId: string, timeSlot: string) => Promise<any>;
  onResetCompletions: () => Promise<any>;
}

export default function SurveyList({ onTriggerReminder, onResetCompletions }: SurveyListProps) {
  const [triggeringSlot, setTriggeringSlot] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Simulation alert parameters
  const [alertFeedback, setAlertFeedback] = useState<{ slot: string, text: string } | null>(null);

  const handleRunAlert = async (slot: string) => {
    setTriggeringSlot(slot);
    setAlertFeedback(null);
    try {
      const res = await onTriggerReminder('current', slot);
      if (res.success) {
        setAlertFeedback({
          slot,
          text: res.messageSent
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTriggeringSlot(null);
    }
  };

  const handleResetCycle = async () => {
    setIsResetting(true);
    setResetSuccess(false);
    try {
      const res = await onResetCompletions();
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="survey-manager-grid">
      
      {/* 1. Cycle Control Panel */}
      <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2 mb-3 tracking-tight">
            <RefreshCw className={`w-5 h-5 text-cyan-400 ${isResetting ? 'animate-spin' : ''}`} /> Управление циклом опроса
          </h3>
          
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Ввиду того, что новые опросы публикуются внешними организаторами в Личном Кабинете «Твой Ход», координация бота ориентируется на <strong className="text-cyan-400 font-semibold">цикл активного опроса</strong>.
          </p>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 select-none">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                При выходе нового опроса в ЛК, сбросьте статусы готовности, чтобы студенты снова стали адресатами напоминаний («должниками»).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 select-none">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Бот автоматически прекратит напоминания каждому пользователю сразу же после того, как тот нажмет кнопку «Опрос пройден» в VK.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResetCycle}
            disabled={isResetting}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition disabled:opacity-50 cursor-pointer duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Сброс статусов...' : 'Начать цикл нового опроса'}
          </button>

          {resetSuccess && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg text-center font-mono font-bold animate-fadeIn">
              ✅ Цикл обновлён! У всех студентов сброшен статус прохождения.
            </div>
          )}
        </div>
      </div>

      {/* 2. Simulator Trigger Actions Panel */}
      <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2 mb-1.5 tracking-tight">
            <Play className="w-5 h-5 text-cyan-400" /> Симуляция рассылок в боте
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-medium">Мгновенный ручной запуск триггеров напоминаний по ТЗ</p>

          <div className="space-y-2.5">
            <button
              onClick={() => handleRunAlert('initial_10_00')}
              disabled={triggeringSlot !== null}
              className="w-full text-left p-2.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/15 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition duration-200"
            >
              <span>📢 Выход опроса: Пуш по умолчанию (10:00)</span>
              <Send className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={() => handleRunAlert('reminder_15_00')}
              disabled={triggeringSlot !== null}
              className="w-full text-left p-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/15 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition duration-200"
            >
              <span>🔔 Деликатное напоминание №1 (15:00)</span>
              <Send className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => handleRunAlert('reminder_19_00')}
              disabled={triggeringSlot !== null}
              className="w-full text-left p-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/15 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition duration-200"
            >
              <span>🔔 Деликатное напоминание №2 (19:00)</span>
              <Send className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => handleRunAlert('reminder_22_00')}
              disabled={triggeringSlot !== null}
              className="w-full text-left p-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/15 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition duration-200"
            >
              <span>⏳ Финальное предупреждение (22:00)</span>
              <Send className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Trigger Response Text Block */}
        {alertFeedback ? (
          <div className="mt-4 p-3 bg-slate-950 text-slate-100 rounded-xl text-[11px] leading-relaxed relative animate-fadeIn border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <span className="font-bold text-cyan-400 block mb-1">💬 Текст напоминания [{alertFeedback.slot.replace('_', ' ').toUpperCase()}]:</span>
            <p className="whitespace-pre-line text-slate-300">{alertFeedback.text}</p>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-slate-950/20 border border-dashed border-slate-800 text-slate-500 rounded-xl text-[11px] text-center font-mono">
            Нажмите любую кнопку запуска выше, чтобы протестировать доставляемый текст
          </div>
        )}
      </div>

    </div>
  );
}
