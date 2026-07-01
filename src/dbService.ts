import fs from 'fs';
import path from 'path';
import { AppDatabase, VKUser, Survey, AppSettings, BotLog, ReminderLog } from './types.js';

const DB_FILE = path.join(process.cwd(), 'database.json');

const DEFAULT_SETTINGS: AppSettings = {
  reminderTime1: "10:00",
  reminderTime2: "15:00",
  reminderTime3: "19:00",
  reminderTime4: "22:00",
  reminderDays: [1, 5], // Понедельник, Пятница
  surveysUrl: "https://tvoyhod.online/lk/track/opredelyayu"
};

// Seed simulated subscribers to display beautiful statistics out-of-the-box
const SIMULATED_USERS: VKUser[] = [];

const SIMULATED_SURVEYS: Survey[] = [];

const SIMULATED_REMINDER_LOGS: ReminderLog[] = [];

const SIMULATED_LOGS: BotLog[] = [
  { id: "l_1", timestamp: new Date().toISOString(), type: "system", text: "Робот и СУБД успешно настроены и ожидают запуск." }
];

export class DBService {
  private static data: AppDatabase | null = null;

  public static load(): AppDatabase {
    if (this.data) {
      return this.data;
    }

    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        return this.data!;
      }
    } catch (e) {
      console.error("Ошибка при чтении базы данных, пересоздаем", e);
    }

    // Initialize default if file doesn't exist
    const defaultData: AppDatabase = {
      users: SIMULATED_USERS,
      surveys: SIMULATED_SURVEYS,
      logs: SIMULATED_LOGS,
      settings: DEFAULT_SETTINGS,
      reminderLogs: SIMULATED_REMINDER_LOGS
    };

    this.data = defaultData;
    this.save();
    return this.data;
  }

  public static save(): void {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Ошибка сохранения базы данных в JSON", e);
    }
  }

  // Helper APIs
  public static getUsers(): VKUser[] {
    return this.load().users;
  }

  public static addUser(user: VKUser): void {
    const db = this.load();
    const exists = db.users.find(u => u.vkId === user.vkId);
    if (!exists) {
      db.users.push(user);
      this.save();
      this.addLog('system', `Зарегистрирован новый пользователь: ${user.firstName} ${user.lastName} (ID: ${user.vkId})`);
    } else {
      exists.lastActionAt = new Date().toISOString();
      this.save();
    }
  }

  public static markSurveyCompleted(vkId: number, surveyId: string): boolean {
    const db = this.load();
    const user = db.users.find(u => u.vkId === vkId);
    if (user) {
      if (!user.completedSurveys.includes(surveyId)) {
        user.completedSurveys.push(surveyId);
        user.lastActionAt = new Date().toISOString();
        
        // Update survey completion count
        const survey = db.surveys.find(s => s.id === surveyId);
        if (survey) {
          survey.completionsCount++;
        }
        
        this.save();
        this.addLog('system', `Пользователь ${user.firstName} ${user.lastName} (ID: ${vkId}) успешно отметил опрос пройденным: ${surveyId}`);
        return true;
      }
    }
    return false;
  }

  public static resetCompletions(): void {
    const db = this.load();
    db.users.forEach(u => {
      u.completedSurveys = [];
    });
    this.save();
    this.addLog('system', "Цикл опроса запущен с нуля. Статусы прохождения всех участников сброшены.");
  }

  public static addSurvey(survey: Survey): void {
    const db = this.load();
    db.surveys.push(survey);
    this.save();
    this.addLog('system', `Добавлен новый опрос: ${survey.title} (ID: ${survey.id})`);
  }

  public static updateSettings(settings: AppSettings): void {
    this.load().settings = settings;
    this.save();
    this.addLog('system', "Настройки интервалов и напоминаний были успешно изменены администратором");
  }

  public static addLog(type: 'incoming' | 'outgoing' | 'system' | 'error', text: string): void {
    const db = this.load();
    const log: BotLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      text
    };
    db.logs.unshift(log); // newest first
    if (db.logs.length > 500) {
      db.logs = db.logs.slice(0, 500); // limit to 500 entries
    }
    this.save();
    console.log(`[BotLog - ${type.toUpperCase()}] ${text}`);
  }

  public static getLogs(): BotLog[] {
    return this.load().logs;
  }

  public static addReminderLog(log: ReminderLog): void {
    const db = this.load();
    db.reminderLogs.push(log);
    this.save();
  }

  public static clearLogs(): void {
    const db = this.load();
    db.logs = [{
      id: "init",
      timestamp: new Date().toISOString(),
      type: "system",
      text: "Панель логов очищена"
    }];
    this.save();
  }
}
