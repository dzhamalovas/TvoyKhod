import React from 'react';
import { ShieldCheck, Server, AlertTriangle, Cpu, Terminal, Key } from 'lucide-react';

export default function HostingGuide() {
  return (
    <div className="glow-card rounded-3xl p-6 md:p-8" id="hosting-guide-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-xl shadow-[0_0_10px_rgba(34,211,238,0.15)]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Руководство по бесперебойной работе</h2>
          <p className="text-xs text-slate-450 text-slate-400">Инструкции по обеспечению аптайма 24/7/365, логированию и мониторингу бота</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Key Rules */}
        <div className="space-y-6">
          <div className="border-l-4 border-cyan-500 bg-cyan-500/5 p-4 rounded-r-2xl border-y border-r border-slate-800/40">
            <h3 className="font-bold text-cyan-300 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider font-mono">
              <Server className="w-4 h-4 text-cyan-400" /> 1. Выберите правильный Хостинг (VPS/VDS)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Для работы в режиме <strong className="text-cyan-400 font-bold">Long Poll</strong> не требуется выделенный домен или белый IP-адрес. Бот сам инициирует исходящие запросы к защищённым серверам VK API. Рекомендуется использовать VPS в РФ (TimeWeb, Selectel, RuVDS) на ОС Ubuntu 22.04 LTS (1 vCPU, 1 GB RAM минимум) для уменьшения пинга.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-indigo-500/5 p-4 rounded-r-2xl border-y border-r border-slate-800/40">
            <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider font-mono">
              <Cpu className="w-4 h-4 text-indigo-400" /> 2. Используйте менеджер процессов PM2
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              PM2 выполняет перезапуск Node.js процесса в случае падения сети, сбоях внешней СУБД или аварийной перезагрузки VPS.
            </p>
            <div className="mt-2.5 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[10px] text-slate-300 leading-relaxed">
              <span className="text-cyan-400 font-bold"># Установка PM2 глобально</span><br />
              npm install pm2 -g<br /><br />
              <span className="text-cyan-400 font-bold"># Запуск скомпилированного сервера</span><br />
              pm2 start dist/server.cjs --name "nepropusti-bot"<br /><br />
              <span className="text-cyan-400 font-bold"># Автозапуск при ребуте VPS</span><br />
              pm2 startup && pm2 save
            </div>
          </div>

          <div className="border-l-4 border-amber-500 bg-amber-500/5 p-4 rounded-r-2xl border-y border-r border-slate-800/40">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> 3. Обработка VK API Rate Limits & Ошибок
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              VK ограничивает отправку до 100 сообщений в секунду для сообществ. Для массовой рассылки студентам трека «Определяю»:
            </p>
            <ul className="list-disc pl-5 mt-2 text-xs text-slate-400 space-y-1.5">
              <li>Добавьте искусственный таймаут (50 мс) между циклическими шагами отправки.</li>
              <li>Всегда перехватывайте ошибки VK API <code>(try/catch)</code>.</li>
              <li>Следите за валидностью токена группы; он может быть аннулирован при смене пароля администратора.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Server Setup Checklist */}
        <div className="space-y-6">
          <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-2xl">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-3 text-xs uppercase tracking-widest font-mono text-cyan-400">
              <Terminal className="w-4 h-4 text-cyan-400" /> Стек Docker для деплоя за минуту
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Для стандартизированного деплоя создайте файл <code>docker-compose.yml</code> в папке проекта:
            </p>
            <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl text-[10px] font-mono overflow-x-auto border border-slate-900">
{`version: '3.8'
services:
  nepropusti:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=your_key
      - VK_GROUP_TOKEN=your_vk_token
      - VK_GROUP_ID=239473350
      - VK_API_VERSION=5.199
      - APP_URL=https://nepropusti.ru`}
            </pre>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-2xl">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2 text-xs uppercase tracking-widest font-mono text-indigo-400">
              <Key className="w-4 h-4 text-indigo-400" /> Системный Крон-просмотрщик
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              В продакшене используйте планировщик <strong className="text-white">Linux Cron</strong>, который будет дергать API точку по расписанию в 10:00, 15:00, 19:00 и 22:00:
            </p>
            <div className="mt-3.5 text-[10px] font-mono bg-slate-950 text-cyan-400 p-3 rounded-xl border border-slate-900 overflow-x-auto">
              {"0 10 * * 1,5 curl -X POST https://your-domain.ru/api/trigger-reminder -H \"Content-Type: application/json\" -d '{\"surveyId\":\"current\", \"timeSlot\":\"initial_10_00\"}'"}
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 font-mono">
              * Замените URL на ваш фактический адрес. Настройки дублированных пушей (15:00, 19:00, 22:00) также зашедульте через curl.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
