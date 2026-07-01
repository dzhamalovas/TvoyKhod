import React, { useState, useRef, useEffect } from 'react';
import { Send, Smartphone, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'student' | 'bot';
  text: string;
  timestamp: Date;
}

interface BotSimulatorProps {
  onMessageSent: () => void; // call parent layout state refresher
}

export default function BotSimulator({ onMessageSent }: BotSimulatorProps) {
  // Pre-seed simulator messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: '👋 Привет! Рады видеть тебя в боте «НеПропусти»! 🏆\n\nЯ твой личный помощник в треке «Определяю» Всероссийского студенческого проекта «Твой Ход».', timestamp: new Date(Date.now() - 600000) }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [simulatorUser, setSimulatorUser] = useState({
    vkId: '10101',
    firstName: 'Иван',
    lastName: 'Иванов'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'student',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // 2. Fetch reply from simulator API endpoint
      const response = await fetch('/api/sim-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vkId: simulatorUser.vkId,
          firstName: simulatorUser.firstName,
          lastName: simulatorUser.lastName,
          text: textToSend
        })
      });

      const data = await response.json();
      
      // Simulate slight bot typing delay for incredible realism
      setTimeout(() => {
        setIsTyping(false);
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'bot',
            text: data.reply,
            timestamp: new Date()
          }]);
          // Refresh parent dashboard values
          onMessageSent();
        } else {
          setMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'bot',
            text: '⚠️ Произошла ошибка на сервере при симуляции ответа бота: ' + data.error,
            timestamp: new Date()
          }]);
        }
      }, 700);

    } catch (err: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        text: '❌ Сбой отправки в симулятор-сервер: ' + err.message,
        timestamp: new Date()
      }]);
    }
  };

  const menuButtons = [
    { label: "✅ Опрос пройден", text: "Опрос пройден", color: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 col-span-2" },
    { label: "📊 Мой статус", text: "Мой статус", color: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20" },
    { label: "ℹ️ О проекте", text: "О проекте", color: "bg-slate-800/40 text-slate-300 hover:bg-slate-800/60 border border-slate-700/50" }
  ];

  return (
    <div className="glow-card rounded-3xl p-6 flex flex-col h-[520px]" id="bot-simulator-card">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.15)]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">VK-Песочница Опросов</h3>
            <p className="text-xs text-slate-400">Интерактивный симулятор чат-клиента</p>
          </div>
        </div>

        {/* Simulator User Selector Settings toggler */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <select 
            className="bg-transparent text-[11px] text-slate-300 outline-none font-semibold cursor-pointer"
            value={simulatorUser.vkId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '10101') setSimulatorUser({ vkId: '10101', firstName: 'Иван', lastName: 'Иванов' });
              if (val === '20202') setSimulatorUser({ vkId: '20202', firstName: 'София', lastName: 'Смирнова' });
              if (val === '50505') setSimulatorUser({ vkId: '50505', firstName: 'Михаил', lastName: 'Васильев' });
            }}
          >
            <option value="10101" className="bg-[#0b1329] text-white">Иван (Активный)</option>
            <option value="20202" className="bg-[#0b1329] text-white">София (Активный)</option>
            <option value="50505" className="bg-[#0b1329] text-white">Михаил (Должник)</option>
          </select>
        </div>
      </div>

      {/* Simulator VK body */}
      <div className="flex-1 bg-slate-950/40 rounded-2xl p-4 flex flex-col h-0 overflow-y-auto mb-3 border border-slate-900">
        <div className="space-y-3.5 flex-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === 'student' 
                  ? 'user-bubble text-white rounded-br-none' 
                  : 'bot-bubble text-slate-200 rounded-bl-none whitespace-pre-wrap'
              }`}>
                {m.text}
                <div className={`text-[8.5px] mt-1.5 text-right font-mono font-medium ${m.sender === 'student' ? 'text-sky-200' : 'text-slate-500'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#0f172a] rounded-2xl p-3 rounded-bl-none shadow border border-slate-800/60 flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Recommended VK Menu Custom Keyboard Layout */}
      <div className="shrink-0 mb-3">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Меню кнопок ВК-бота:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {menuButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(btn.text)}
              className={`py-2 px-3 text-[11px] font-bold rounded-xl text-center cursor-pointer transition duration-200 border ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input text field */}
      <div className="shrink-0 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          placeholder="Напишите боту что-нибудь..."
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-cyan-500 focus:bg-slate-900/10 text-white transition duration-200"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition duration-200 cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
