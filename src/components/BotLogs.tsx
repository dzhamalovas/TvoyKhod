import React from 'react';
import { Bot, Trash2, RefreshCw } from 'lucide-react';
import { BotLog } from '../types.js';

interface BotLogsProps {
  logs: BotLog[];
  onClear: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function BotLogs({ logs, onClear, onRefresh, isLoading }: BotLogsProps) {
  return (
    <div className="glow-card rounded-3xl p-6 flex flex-col h-[520px]" id="bot-logs-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.15)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Дашборд-Логи активности</h3>
            <p className="text-xs text-slate-400">События VK в реальном времени</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className={`p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition ${isLoading ? 'animate-spin' : ''}`}
            title="Обновить логи"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition text-xs flex items-center gap-1.5 px-2.5 font-semibold cursor-pointer"
            title="Очистить консоль"
          >
            <Trash2 className="w-3.5 h-3.5" /> Очистить
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-950/80 rounded-2xl p-4 font-mono text-[11px] space-y-2 border border-slate-900 shadow-inner">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-10 font-mono">Ленты логов пусты... Взаимодействуйте со студентами в чате!</div>
        ) : (
          logs.map((log) => {
            let typeColor = 'text-slate-400';
            let typeLabel = 'SYS';
            if (log.type === 'incoming') {
              typeColor = 'text-cyan-400 font-bold';
              typeLabel = 'IN ';
            } else if (log.type === 'outgoing') {
              typeColor = 'text-emerald-400 font-bold';
              typeLabel = 'OUT';
            } else if (log.type === 'error') {
              typeColor = 'text-rose-400 font-bold animate-pulse';
              typeLabel = 'ERR';
            } else if (log.type === 'system') {
              typeColor = 'text-indigo-400';
              typeLabel = 'SYS';
            }

            const cleanTime = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div key={log.id} className="border-b border-slate-900/40 pb-1.5 last:border-none last:pb-0 text-slate-350 flex items-start gap-2 leading-relaxed">
                <span className="text-slate-650 shrink-0 text-slate-500 font-mono">{cleanTime}</span>
                <span className={`${typeColor} shrink-0 select-none font-bold`} style={{ width: '28px' }}>
                  [{typeLabel}]
                </span>
                <span className="break-all whitespace-pre-wrap">{log.text}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3.5 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Показано последних событий: {logs.length}</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-pulse shadow-[0_0_8px_#10b981]"></span>
          Активно (Long Poll)
        </span>
      </div>
    </div>
  );
}
