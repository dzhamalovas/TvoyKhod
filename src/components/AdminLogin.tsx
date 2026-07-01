import React, { useState } from 'react';
import { Lock, Unlock, Compass } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === 'твойход' || password === 'непропусти') {
      setError('');
      onLogin();
    } else {
      setError('Неверный код доступа администратора. Попробуйте "admin"');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4" id="login-container">
      <div className="w-full max-w-md glow-card rounded-3xl p-8 md:p-10 relative overflow-hidden transition-all duration-300">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>

        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            НП <span className="text-cyan-400 neon-text">НеПропусти</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Вход в административную панель управления VK-ботом
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
              Пароль администратора
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Код доступа... (по умолчанию: admin)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 text-sm transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-rose-400 text-xs mt-3 font-semibold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                ⚠️ {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            Авторизоваться <Unlock className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/60 pt-5">
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Всероссийский студенческий проект «Твой Ход»<br />
            Кураторский сервис трека «Определяю»
          </p>
        </div>
      </div>
    </div>
  );
}
