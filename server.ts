import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { DBService } from './src/dbService.js';
import { VKUser, Survey, AppSettings, ReminderLog } from './src/types.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Initialize Google Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini AI API successfully configured.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI", err);
  }
} else {
  console.log("No Gemini API key detected (or placeholder is active). AI functions will degrade to offline helper.");
}

// VK API Configurations
const VK_TOKEN = process.env.VK_GROUP_TOKEN || '';
const VK_GROUP_ID = process.env.VK_GROUP_ID || '239473350';
const VK_API_VERSION = process.env.VK_API_VERSION || '5.199';

// Keyboard Object for VK replies
const VK_KEYBOARD = {
  one_time: false,
  buttons: [
    [
      {
        action: {
          type: "text",
          payload: JSON.stringify({ action: "complete_survey" }),
          label: "✅ Опрос пройден"
        },
        color: "positive"
      }
    ],
    [
      {
        action: {
          type: "text",
          payload: JSON.stringify({ action: "status" }),
          label: "📊 Мой статус"
        },
        color: "primary"
      },
      {
        action: {
          type: "text",
          payload: JSON.stringify({ action: "about" }),
          label: "ℹ️ О проекте «НеПропусти»"
        },
        color: "secondary"
      }
    ]
  ],
  inline: false
};

// Start DB service
DBService.load();

// REST API Endpoints for Dashboard
app.get('/api/state', (req, res) => {
  try {
    const data = DBService.load();
    res.json({
      success: true,
      data: {
        users: data.users,
        surveys: data.surveys,
        logs: data.logs,
        settings: data.settings,
        reminderLogs: data.reminderLogs,
        vkConfigured: !!VK_TOKEN && VK_TOKEN !== 'vk1.a.your_token_here'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settings: AppSettings = req.body;
    DBService.updateSettings(settings);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/add-survey', (req, res) => {
  try {
    const { title, url, scheduledFor } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, error: 'Заголовок и ссылка обязательны' });
    }

    const newSurvey: Survey = {
      id: `survey_${Date.now()}`,
      title,
      url,
      scheduledFor: scheduledFor || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      completionsCount: 0
    };

    DBService.addSurvey(newSurvey);
    res.json({ success: true, survey: newSurvey });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/logs/clear', (req, res) => {
  try {
    DBService.clearLogs();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Motivation generator endpoint
app.post('/api/generate-ai-motivation', async (req, res) => {
  const { topic } = req.body;
  const prompt = `Ты — куратор проекта «Твой Ход». Сделай короткое, вдохновляющее и неформальное напутствие (до 2-3 предложений) на русском языке для студентов, чтобы они прошли опрос на тему: "${topic || 'Активность в треках Твоего Хода'}". Используй смайлики. Сделай его очень дружелюбным.`;
  
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      const text = response.text || "Давай делать Твой Ход ярче вместе! Пройди опрос прямо сейчас и забери заслуженные баллы. 🚀";
      return res.json({ success: true, text });
    } catch (err) {
      console.error(err);
      return res.json({ success: false, text: "Двойные баллы уже ждут тебя! Заполни опрос сегодня, поддержи проект и будь в числе первых. 💫" });
    }
  } else {
    return res.json({
      success: true,
      text: "Время менять студенчество к лучшему! Участвуй в опросе прямо сейчас и получи умноженные баллы в личный кабинет. 🌟"
    });
  }
});

// CSV export endpoint
app.get('/api/export-csv', (req, res) => {
  try {
    const users = DBService.getUsers();
    
    // Create CSV header
    let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 support
    csvContent += 'VK ID,Имя,Фамилия,Дата регистрации,Пройдено опросов,Последняя активность,Тип пользователя\n';
    
    users.forEach(u => {
      const completionCount = u.completedSurveys.length;
      const type = u.isSimulated ? 'Симуляционный (Бот)' : 'Реальный (VK)';
      const row = [
        u.vkId,
        `"${u.firstName.replace(/"/g, '""')}"`,
        `"${u.lastName.replace(/"/g, '""')}"`,
        `"${u.registeredAt}"`,
        completionCount,
        `"${u.lastActionAt}"`,
        `"${type}"`
      ].join(',');
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=nepropusti_statistics.csv');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).send('Ошибка при экспорте: ' + err.message);
  }
});

// Manual reminder sender (simulation & actual dispatch support)
// Helper to trigger reminder send-out and save log entry
async function triggerReminderInternal(timeSlot: string): Promise<{ success: boolean; log: ReminderLog; messageSent: string }> {
  const db = DBService.load();
  const surveyUrl = db.settings.surveysUrl || 'https://tvoyhod.online/';

  const users = DBService.getUsers();
  // Filter out users who already completed the current survey
  const targetUsers = users.filter(u => !u.completedSurveys.includes('current'));

  let messageText = '';
  switch(timeSlot) {
    case 'initial_10_00':
      messageText = `🔔 Вышел новый опрос в треке «Определяю»!\n\nПройди его сегодня, чтобы получить двойные баллы.\n\nСсылка на платформу: ${surveyUrl}\n\nПосле прохождения обязательно нажми кнопку «Опрос пройден» здесь, чтобы больше не получать напоминания!`;
      break;
    case 'reminder_15_00':
      messageText = `Напоминаем, что новый опрос в треке «Определяю» ещё ждёт тебя!\n\nЕсли уже прошёл его — просто нажми кнопку «Опрос пройден».\n\nЕсли ещё нет — сейчас самое время. Ссылка: ${surveyUrl}\n\nДвойные баллы начисляются только до конца дня.`;
      break;
    case 'reminder_19_00':
      messageText = `До окончания периода начисления двойных баллов остаётся всё меньше времени.\n\nНе забудь пройти сегодняшний опрос в треке «Определяю» и отметить его в боте.\n\nПлатформа «Твой Ход»: ${surveyUrl}`;
      break;
    case 'reminder_22_00':
      messageText = `⏳ Сегодня последний шанс получить двойные баллы за сегодняшний опрос в треке «Определяю».\n\nЕсли ещё не успел — самое время пройти его: ${surveyUrl}`;
      break;
    default:
      messageText = `🔔 Напоминаем о необходимости пройти актуальный опрос в треке «Определяю»: ${surveyUrl}`;
  }

  let successCount = 0;
  let realCount = 0;
  let simulatedCount = 0;
  
  // Send to verified active VK users if token compiles and is not a placeholder
  const hasVk = !!VK_TOKEN && 
                 VK_TOKEN !== 'vk1.a.your_token_here' && 
                 VK_TOKEN !== 'your_vk_group_token_here' && 
                 VK_TOKEN.trim() !== '';

  for (const user of targetUsers) {
    if (hasVk && !user.isSimulated) {
      // Send actual VK message
      try {
        await sendVKMessage(user.vkId, messageText);
        successCount++;
        realCount++;
        DBService.addLog('outgoing', `[Real VK] Успешно отправлено напоминание ${user.firstName} ${user.lastName} (ID: ${user.vkId})`);
      } catch (err: any) {
        DBService.addLog('error', `Не удалось отправить сообщение пользователю ${user.vkId}: ${err.message || err}`);
      }
    } else {
      // Simulation mode
      successCount++;
      simulatedCount++;
      DBService.addLog('system', `[СИМУЛЯЦИЯ] Отправлено виртуальное напоминание ${user.firstName} ${user.lastName} (ID: ${user.vkId}). Реальная отправка пропущена (VK токен не настроен или пользователь симуляционный)`);
    }
  }

  // Add reminder dispatch entry to DB
  const newRemLog: ReminderLog = {
    id: `rl_${Date.now()}`,
    timestamp: new Date().toISOString(),
    surveyId: 'current',
    type: (timeSlot as any) || 'initial_10_00',
    recipientsCount: targetUsers.length,
    successCount: realCount // Log real successful deliveries in database log
  };

  DBService.addReminderLog(newRemLog);
  
  if (hasVk) {
    DBService.addLog('system', `Запуск рассылки [${timeSlot?.replace('_', ' ').toUpperCase()}]. Получателей: ${targetUsers.length}, Реально доставлено: ${realCount}, Ошибок: ${targetUsers.length - realCount}`);
  } else {
    DBService.addLog('system', `📢 [СИМУЛЯЦИЯ] Рассылка [${timeSlot?.replace('_', ' ').toUpperCase()}] завершена в тестовом режиме. Реальная отправка недоступна (VK_GROUP_TOKEN не настроен на сервере). Получателей: ${targetUsers.length}`);
  }

  return {
    success: true,
    log: newRemLog,
    messageSent: messageText
  };
}

// REST API Endpoint to trigger reminders manually (supports GET and POST for cron-jobs/webhooks)
app.all('/api/trigger-reminder', async (req, res) => {
  try {
    // Get timeSlot from query parameters (for GET requests) or body (for POST requests)
    const timeSlot = req.query.timeSlot || req.body?.timeSlot || 'initial_10_00';
    DBService.addLog('system', `Получен запрос на запуск рассылки напоминаний (TimeSlot: ${timeSlot}) по API/Крону`);
    const result = await triggerReminderInternal(timeSlot as string);
    res.json(result);
  } catch (err: any) {
    DBService.addLog('error', `Ошибка API запуска напоминаний: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset completions endpoint to start a brand new survey tracking cycle (supports GET and POST)
app.all('/api/reset-completions', (req, res) => {
  try {
    DBService.addLog('system', 'Получен запрос на сброс статусов прохождения опросов студентов');
    DBService.resetCompletions();
    res.json({ success: true, message: 'Статусы всех студентов успешно сброшены. Ожидаем прохождение нового опроса!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive Client-Side Bot Simulator Endpoint (So the user can test the bot replies in UI!)
app.post('/api/sim-message', async (req, res) => {
  try {
    const { vkId, firstName, lastName, text, payload } = req.body;
    if (!vkId || !text) {
      return res.status(400).json({ success: false, error: 'vkId and text are required' });
    }

    // Register user if new
    const cleanVkId = parseInt(vkId);
    DBService.addUser({
      vkId: cleanVkId,
      firstName: firstName || 'Пользователь',
      lastName: lastName || 'Симулятора',
      registeredAt: new Date().toISOString(),
      completedSurveys: [],
      lastActionAt: new Date().toISOString(),
      isSimulated: false // Act as real
    });

    DBService.addLog('incoming', `[СИМУЛЯТОР VK ID: ${cleanVkId} - ${firstName}] "${text}"`);
    
    // Process response text
    const response = await processBotMessage(cleanVkId, text, payload);
    
    DBService.addLog('outgoing', `[ОТВЕТ СИМУЛЯТОРУ ID: ${cleanVkId}] "${response.message}"`);
    
    res.json({
      success: true,
      reply: response.message,
      keyboard: response.keyboard
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Core Bot Response Processor logic (Shared for Real VK Bot and Web simulator!)
async function processBotMessage(vkId: number, text: string, payloadStr?: any): Promise<{ message: string, keyboard?: any }> {
  const normalizedText = (text || '').trim().toLowerCase();
  const db = DBService.load();
  let user = db.users.find(u => Number(u.vkId) === Number(vkId));
  const userName = user ? user.firstName : 'Участник';
  const surveyUrl = db.settings.surveysUrl || 'https://tvoyhod.online/';

  let isCompleteSurvey = false;
  let isStatus = false;
  let isAbout = false;

  // 1. Try to parse payload if present
  if (payloadStr) {
    try {
      const payloadObj = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
      const act = payloadObj?.action || payloadObj?.command || payloadObj?.button;
      if (act === 'complete_survey' || act === 'complete') isCompleteSurvey = true;
      if (act === 'status') isStatus = true;
      if (act === 'about') isAbout = true;
      
      if (typeof payloadStr === 'string' && payloadStr.includes('complete_survey')) {
        isCompleteSurvey = true;
      }
    } catch (e) {
      if (typeof payloadStr === 'string' && payloadStr.includes('complete_survey')) {
        isCompleteSurvey = true;
      }
    }
  }

  // 2. Comprehensive Russian keyword and root matching for "Опрос пройден"
  const completionKeywords = [
    'опрос пройден', 'опрос прошел', 'опрос прошла', 'опрос заполнил', 'опрос заполнила',
    'пройден', 'пройдено', 'пройдена', 'пройдены',
    'прошел', 'прошла', 'прошёл', 'прошли',
    'заполнил', 'заполнила', 'заполнено',
    'отметил', 'отметила', 'отметить опрос',
    'готово', 'сделал', 'сделала', 'сделано',
    'я прошел', 'я прошла', 'я заполнил', 'я заполнила'
  ];

  if (completionKeywords.some(kw => normalizedText.includes(kw))) {
    isCompleteSurvey = true;
  }
  if (normalizedText.includes('статус') || normalizedText.includes('мой статус')) {
    isStatus = true;
  }
  if (normalizedText.includes('проекте') || normalizedText.includes('сервис') || normalizedText.includes('непропусти')) {
    isAbout = true;
  }

  // 1. GREETINGS
  if (normalizedText === 'старт' || normalizedText === 'привет' || normalizedText === 'начать' || normalizedText === 'start') {
    let msg = `👋 Привет, ${userName}! Рады видеть тебя в боте «НеПропусти»! 🏆\n\n`;
    msg += `Я твой личный помощник в треке «Определяю». Моя главная миссия — чтобы ты никогда больше не пропускал новые опросы в треке и вовремя получал свои баллы (в том числе двойные баллы за быструю реакцию!).\n\n`;
    
    const isCompleted = user ? user.completedSurveys.includes('current') : false;
    msg += `📢 Текущий статус по опросам трека «Определяю»:\n`;
    if (isCompleted) {
      msg += `\nСтатус: ✅ ВСЁ СДЕЛАНО. Ты уже прошёл опрос! Молодец. Двойные баллы в безопасности! 💫`;
    } else {
      msg += `\nСтатус: ⏳ ТРЕБУЕТСЯ ЗАПОЛНИТЬ.\n🔗 Личный кабинет «Твой Ход»: ${surveyUrl}\n\nПройди крайний опрос в своём ЛК прямо сейчас и нажми кнопку «Опрос пройден» ниже, чтобы зафиксировать статус!`;
    }
    
    return { message: msg, keyboard: VK_KEYBOARD };
  }

  // 2. COMPLETE SURVEY CONFIRMATION
  if (isCompleteSurvey) {
    if (!user) {
      DBService.addUser({
        vkId,
        firstName: 'Студент',
        lastName: 'Твоего Хода',
        registeredAt: new Date().toISOString(),
        completedSurveys: [],
        lastActionAt: new Date().toISOString()
      });
      user = DBService.load().users.find(u => Number(u.vkId) === Number(vkId));
    }

    const alreadyDone = user ? user.completedSurveys.includes('current') : false;
    if (alreadyDone) {
      return {
        message: `😉 Ты уже отметил опрос трека «Определяю» как пройденный! Твой статус зафиксирован, напоминания отключены. Двойные баллы гарантированы! 🏅`,
        keyboard: VK_KEYBOARD
      };
    }

    // Mark completed in database
    DBService.markSurveyCompleted(vkId, 'current', user?.firstName, user?.lastName);
    
    let completionMessage = `🎉 Ура! Твой статус обновлён.\n\nТы успешно отметил актуальный опрос трека пройденным! 👍\n\nЯ убрал тебя из рассылки напоминаний на сегодня. Спасибо за активность, баллы начислены в системе «Твой Ход»! 💪`;
    return { message: completionMessage, keyboard: VK_KEYBOARD };
  }

  // 3. CHECK USER STATUS
  if (isStatus) {
    let msg = `📊 Твой профиль активности «НеПропусти»:\n\n`;
    msg += `👤 Имя: ${userName}\n`;
    msg += `🔑 VK ID: ${vkId}\n`;
    
    if (user) {
      const isDone = user.completedSurveys.includes('current');
      msg += `⭐ Актуальный опрос трека: ${isDone ? '✅ Пройден' : '⏳ Не пройден'}\n\n`;
      if (!isDone) {
        msg += `🔗 Ты можешь пройти его в личном кабинете: ${surveyUrl}\n` +
               `После этого обязательно нажми «Опрос пройден»!`;
      } else {
        msg += `Ты молодец, двойные баллы в безопасности! Спасибо за поддержку трека «Определяю». 💫`;
      }
    } else {
      msg += `Ты еще не зарегистрирован в базе данных активности. Напиши «Привет», чтобы начать!`;
    }
    
    return { message: msg, keyboard: VK_KEYBOARD };
  }

  // 4. ABOUT PROJECT
  if (isAbout) {
    let msg = `⚙️ О сервисе «НеПропусти»:\n\n`;
    msg += `Информационный бот разработан специально для участников студенческого трека «Определяю» проекта «Твой Ход».\n\n`;
    msg += `💡 Основные фичи:\n`;
    msg += `— Автоматические напоминания об опросах по понедельникам и пятницам в 10:00 утра (МСК);\n`;
    msg += `— Четырехэтапные деликатные напоминания (10:00, 15:00, 19:00, 22:00);\n`;
    msg += `— Автоматическая деактивация уведомлений сразу после нажатия кнопки «Опрос пройден»;\n`;
    
    return { message: msg, keyboard: VK_KEYBOARD };
  }

  // 5. AI MOTIVATION ADVICE
  if (normalizedText.includes('совет') || normalizedText.includes('ии') || normalizedText.includes('ии-совет')) {
    try {
      const topic = "студенческий трек «Определяю» проекта «Твой Ход»";
      const prompt = `Ты — дружелюбный ИИ-наставник проекта «Твой Ход» на тему развития образования и активности студентов. Дай короткий (до 140 символов), оригинальный совет или цитату дня студенту на тему "${topic}", чтобы поднять его дух и вдохновить его внести вклад пройдя опросы. Ответ напиши на русском языке с эмодзи. Сделай его емким и приятным.`;
      
      let resText = '';
      if (ai) {
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        resText = aiResponse.text || '';
      }
      
      if (!resText) {
        resText = "💡 Твой голос — твой вклад! Опросы трека «Определяю» помогают менять вуз к лучшему прямо сейчас. Потрать 3 минуты, спаси студенчество! 🌠";
      }

      return {
        message: `🔮 Персональный ИИ-Совет Куратора:\n\n"${resText.trim()}"\n\n✨ Сделай свой шаг в «Твиттер Твоего Хода»! Проходи опросы и забирай Double-баллы.`,
        keyboard: VK_KEYBOARD
      };
    } catch (e) {
      return {
        message: `💡 Совет дня: Каждый опрос — это твой личный голос, влияющий на развитие студенчества в РФ. Сделай свой Ход, внеси изменения! 🌟`,
        keyboard: VK_KEYBOARD
      };
    }
  }

  // FALLBACK OR GEMINI INTELLIGENCE CO-PILOT replies if unknown!
  try {
    if (ai) {
      const fallbackPrompt = `Ты — куратор VK-бота «НеПропусти» трека «Определяю» Всероссийского студенческого проекта «Твой Ход». Студент написал тебе: "${text}". Ответь ему дружелюбно, лаконично (1-2 предложения) на русском языке с эмодзи. Напомни ему, что он может пройти опрос по кнопкам меню.`;
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: fallbackPrompt
      });
      const aiText = aiResponse.text || '';
      if (aiText) {
        return { message: aiText.trim(), keyboard: VK_KEYBOARD };
      }
    }
  } catch (err) {}

  return {
    message: `🤖 Я тебя понял! Пользуйся удобным меню внизу:\n\n` +
             `✅ Нажми «Опрос пройден», если уже завершил опрос.\n` +
             `📊 Нажми «Мой статус», чтобы узнать свою статистику.\n\n` +
             `Всегда на связи, твоя команда «НеПропусти»! 🔥`,
    keyboard: VK_KEYBOARD
  };
}

// Low level VK API request dispatcher
async function sendVKMessage(peerId: number, message: string) {
  if (!VK_TOKEN || VK_TOKEN === 'vk1.a.your_token_here') {
    throw new Error('VK Group Token is not configured');
  }

  const queryParams = new URLSearchParams({
    peer_id: peerId.toString(),
    message: message,
    random_id: Math.floor(Math.random() * 2000000000).toString(),
    keyboard: JSON.stringify(VK_KEYBOARD),
    access_token: VK_TOKEN,
    v: VK_API_VERSION
  });

  const response = await fetch('https://api.vk.com/method/messages.send', {
    method: 'POST',
    body: queryParams
  });

  const data: any = await response.json();
  if (data.error) {
    throw new Error(`VK API Error: [${data.error.error_code}] ${data.error.error_msg}`);
  }
  return data;
}

// Answer callback button events (message_event)
async function sendVKMessageEventAnswer(userId: number, eventId: string, peerId: number, snackbarText?: string) {
  if (!VK_TOKEN || VK_TOKEN === 'vk1.a.your_token_here') return;
  try {
    const params = new URLSearchParams({
      event_id: eventId,
      user_id: userId.toString(),
      peer_id: peerId.toString(),
      access_token: VK_TOKEN,
      v: VK_API_VERSION
    });
    if (snackbarText) {
      params.set('event_data', JSON.stringify({ type: "show_snackbar", text: snackbarText }));
    }
    await fetch('https://api.vk.com/method/messages.sendMessageEventAnswer', {
      method: 'POST',
      body: params
    });
  } catch (e) {
    console.error("Failed to answer VK message event", e);
  }
}

// Polling core generator for VK Long Poll Server
async function runVkLongPoll() {
  if (!VK_TOKEN || 
      VK_TOKEN === 'vk1.a.your_token_here' || 
      VK_TOKEN === 'your_vk_group_token_here' || 
      VK_TOKEN.trim() === '') {
    DBService.addLog('system', 'VK_GROUP_TOKEN отсутствует или является плейсхолдером. Бот функционирует в РЕЖИМЕ СИМУЛЯЦИИ ПАНЕЛИ.');
    return;
  }

  if (process.env.DISABLE_VK_POLLING === "true") {
    console.log("[BOT] Real VK Longpoll is explicitly disabled by DISABLE_VK_POLLING env variable.");
    DBService.addLog('system', 'VK Bot Long Poll отключен переменной DISABLE_VK_POLLING.');
    return;
  }

  DBService.addLog('system', `Авторизация бота VK (Группа ID: ${VK_GROUP_ID}) в Long Poll...`);

  try {
    const serverUrlParams = new URLSearchParams({
      group_id: VK_GROUP_ID,
      access_token: VK_TOKEN,
      v: VK_API_VERSION
    });

    const initRes = await fetch('https://api.vk.com/method/groups.getLongPollServer', {
      method: 'POST',
      body: serverUrlParams
    });

    const body: any = await initRes.json();
    if (body.error) {
      throw new Error(`Failed to get VK LongPoll server: [${body.error.error_code}] ${body.error.error_msg}`);
    }

    const { server, key, ts } = body.response;
    DBService.addLog('system', `Соединение с VK Long Poll успешно установлено! Слушаем входящие сообщения и нажатия кнопок...`);

    let currentTs = ts;

    // Start polling loop
    while (true) {
      try {
        const pollUrl = `${server}?act=a_check&key=${key}&ts=${currentTs}&wait=25`;
        const pollRes = await fetch(pollUrl);
        const pollData: any = await pollRes.json();

        if (pollData.failed) {
          if (pollData.failed === 1) {
            currentTs = pollData.ts;
          } else {
            console.log('Long Poll failed key expiration/migration, restarting longpoll connection...');
            setTimeout(runVkLongPoll, 3000);
            break;
          }
          continue;
        }

        currentTs = pollData.ts;

        if (pollData.updates && pollData.updates.length > 0) {
          for (const update of pollData.updates) {
            // 1. Regular incoming messages and text keyboard button clicks
            if (update.type === 'message_new') {
              const message = update.object?.message || update.object;
              if (!message) continue;

              const userId = Number(message.from_id || message.user_id || message.peer_id);
              if (!userId) continue;

              const text = (message.text || '').trim();
              const payload = message.payload;

              // Try to fetch user name from VK to register user beautifully
              let firstName = 'Студент';
              let lastName = 'Твоего Хода';
              try {
                const userGetUrl = `https://api.vk.com/method/users.get?user_ids=${userId}&access_token=${VK_TOKEN}&v=${VK_API_VERSION}`;
                const userRes = await fetch(userGetUrl);
                const userData: any = await userRes.json();
                if (userData.response && userData.response[0]) {
                  firstName = userData.response[0].first_name || 'Студент';
                  lastName = userData.response[0].last_name || 'Твоего Хода';
                }
              } catch (e) {
                console.error("Failed to fetch user profiles from VK", e);
              }

              // Add/update user in db
              DBService.addUser({
                vkId: userId,
                firstName,
                lastName,
                registeredAt: new Date().toISOString(),
                completedSurveys: [],
                lastActionAt: new Date().toISOString()
              });

              DBService.addLog('incoming', `[Real VK] Сообщение от ${firstName} ${lastName} (ID: ${userId}): "${text}"`);

              // Process Bot reply logic
              const finalReply = await processBotMessage(userId, text, payload);

              // Send response back
              try {
                await sendVKMessage(userId, finalReply.message);
                DBService.addLog('outgoing', `[Real VK] Ответ отправлен пользователю ${userId}`);
              } catch (err: any) {
                DBService.addLog('error', `Ошибка отправки сообщения VK: ${err.message}`);
              }
            }

            // 2. Callback-button events (when user clicks an inline callback button)
            if (update.type === 'message_event') {
              const eventObj = update.object;
              if (eventObj) {
                const userId = Number(eventObj.user_id || eventObj.peer_id);
                const eventId = eventObj.event_id;
                const payload = eventObj.payload;

                DBService.addLog('incoming', `[Real VK Callback Button] Нажата кнопка пользователем ID: ${userId}`);

                // Answer immediately so the button stops showing loading spinner
                await sendVKMessageEventAnswer(userId, eventId, Number(eventObj.peer_id || userId), "Опрос отмечен как пройденный! ✅");

                // Process bot message logic
                const finalReply = await processBotMessage(userId, "Опрос пройден", payload);

                try {
                  await sendVKMessage(userId, finalReply.message);
                  DBService.addLog('outgoing', `[Real VK] Ответ отправлен пользователю ${userId}`);
                } catch (err: any) {
                  DBService.addLog('error', `Ошибка отправки сообщения VK: ${err.message}`);
                }
              }
            }
          }
        }
      } catch (pollErr: any) {
        console.error("Exception in active Long Poll loop segment", pollErr);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

  } catch (err: any) {
    DBService.addLog('error', `Критическая ошибка запуска VK Bot: ${err.message}.`);
  }
}

// VK Callback API Webhook support (for users who configure Webhook/Callback API instead of LongPoll)
app.post(['/api/vk-callback', '/vk-callback', '/callback'], async (req, res) => {
  try {
    const { type, object, group_id } = req.body;
    
    // 1. VK confirmation handshake
    if (type === 'confirmation') {
      const confirmCode = process.env.VK_CONFIRMATION_CODE || 'ok';
      DBService.addLog('system', `Получен запрос подтверждения Callback API от VK (Группа: ${group_id}).`);
      return res.send(confirmCode);
    }

    // 2. Handle message_new
    if (type === 'message_new') {
      const message = object?.message || object;
      if (message) {
        const userId = Number(message.from_id || message.user_id || message.peer_id);
        const text = (message.text || '').trim();
        const payload = message.payload;

        if (userId) {
          let firstName = 'Студент';
          let lastName = 'Твоего Хода';
          try {
            const userGetUrl = `https://api.vk.com/method/users.get?user_ids=${userId}&access_token=${VK_TOKEN}&v=${VK_API_VERSION}`;
            const userRes = await fetch(userGetUrl);
            const userData: any = await userRes.json();
            if (userData.response && userData.response[0]) {
              firstName = userData.response[0].first_name || 'Студент';
              lastName = userData.response[0].last_name || 'Твоего Хода';
            }
          } catch (e) {}

          DBService.addUser({
            vkId: userId,
            firstName,
            lastName,
            registeredAt: new Date().toISOString(),
            completedSurveys: [],
            lastActionAt: new Date().toISOString()
          });

          DBService.addLog('incoming', `[Real VK Callback] Сообщение от ${firstName} ${lastName} (ID: ${userId}): "${text}"`);
          const finalReply = await processBotMessage(userId, text, payload);

          try {
            await sendVKMessage(userId, finalReply.message);
            DBService.addLog('outgoing', `[Real VK] Ответ отправлен пользователю ${userId}`);
          } catch (err: any) {
            DBService.addLog('error', `Ошибка отправки сообщения VK: ${err.message}`);
          }
        }
      }
      return res.send('ok');
    }

    // 3. Handle message_event
    if (type === 'message_event') {
      if (object) {
        const userId = Number(object.user_id || object.peer_id);
        const eventId = object.event_id;
        const payload = object.payload;

        if (userId && eventId) {
          await sendVKMessageEventAnswer(userId, eventId, Number(object.peer_id || userId), "Опрос отмечен как пройденный! ✅");
          const finalReply = await processBotMessage(userId, "Опрос пройден", payload);
          try {
            await sendVKMessage(userId, finalReply.message);
          } catch (err: any) {}
        }
      }
      return res.send('ok');
    }

    return res.send('ok');
  } catch (err: any) {
    console.error("VK Callback error", err);
    res.send('ok');
  }
});

// Timezone-aware scheduler helper functions for Moscow (UTC+3)
function getMoscowTimeAndDay(): { dayOfWeek: number; timeString: string; dateString: string } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  
  const moscowNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const dayOfWeek = moscowNow.getDay();
  
  const timeString = `${hour}:${minute}`;
  const dateString = `${year}-${month}-${day}`;
  
  return { dayOfWeek, timeString, dateString };
}

function getMoscowDateString(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(date);
}

function normalizeTime(tStr: string): string {
  if (!tStr) return "";
  const parts = tStr.split(':');
  if (parts.length !== 2) return "";
  const h = parseInt(parts[0], 10).toString().padStart(2, '0');
  const m = parseInt(parts[1], 10).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Background scheduler that runs every 60 seconds
function runBackgroundScheduler() {
  console.log("[SCHEDULER] Active background timezone-aware scheduler initialized.");
  setInterval(async () => {
    try {
      const db = DBService.load();
      const settings = db.settings;
      if (!settings) return;

      const { dayOfWeek, timeString } = getMoscowTimeAndDay();

      // Check if today is a scheduled day
      const reminderDays = settings.reminderDays || [1, 5];
      if (!reminderDays.includes(dayOfWeek)) {
        return;
      }

      const curNormalized = normalizeTime(timeString);

      // Check each time slot
      const slots = [
        { slotName: 'initial_10_00', settingTime: settings.reminderTime1 || '10:00' },
        { slotName: 'reminder_15_00', settingTime: settings.reminderTime2 || '15:00' },
        { slotName: 'reminder_19_00', settingTime: settings.reminderTime3 || '19:00' },
        { slotName: 'reminder_22_00', settingTime: settings.reminderTime4 || '22:00' }
      ];

      for (const slot of slots) {
        if (normalizeTime(slot.settingTime) === curNormalized) {
          const moscowTodayStr = getMoscowDateString(new Date());
          const alreadySent = db.reminderLogs.some(log => {
            try {
              const logDateStr = getMoscowDateString(new Date(log.timestamp));
              return logDateStr === moscowTodayStr && log.type === slot.slotName;
            } catch (e) {
              return false;
            }
          });

          if (!alreadySent) {
            // IF this is the FIRST notification of the scheduled day (initial_10_00),
            // reset all users' completions for the new survey cycle!
            if (slot.slotName === 'initial_10_00') {
              console.log(`[AUTOSCHEDULER] Automatic scheduled reset of completions for today's survey cycle: ${moscowTodayStr}`);
              DBService.resetCompletions();
            }

            console.log(`[AUTOSCHEDULER] Automatic scheduled reminder trigger: ${slot.slotName} for ${moscowTodayStr}`);
            await triggerReminderInternal(slot.slotName);
          }
        }
      }
    } catch (err) {
      console.error("[AUTOSCHEDULER ERROR]", err);
    }
  }, 60000);
}

// Launch VK bot background polling & internal scheduler
runVkLongPoll();
runBackgroundScheduler();


// Vite asset-serving and SPA routes middleware flow setup
if (process.env.NODE_ENV !== "production") {
  import('vite').then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ "НеПропусти" Full Stack Server is active on port ${PORT}`);
});
