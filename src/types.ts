export interface VKUser {
  vkId: number;
  firstName: string;
  lastName: string;
  registeredAt: string;
  completedSurveys: string[]; // List of survey IDs completed
  lastActionAt: string;
  isSimulated?: boolean;
}

export interface Survey {
  id: string; // e.g. "survey_2026_06_22"
  title: string;
  url: string;
  scheduledFor: string; // "YYYY-MM-DD"
  createdAt: string;
  completionsCount: number;
}

export interface ReminderLog {
  id: string;
  timestamp: string;
  surveyId: string;
  type: 'initial_10_00' | 'reminder_15_00' | 'reminder_19_00' | 'reminder_22_00';
  recipientsCount: number;
  successCount: number;
}

export interface AppSettings {
  reminderTime1: string; // "10:00"
  reminderTime2: string; // "15:00"
  reminderTime3: string; // "19:00"
  reminderTime4: string; // "22:00"
  reminderDays: number[]; // [1, 5] for Monday, Friday
  surveysUrl: string; // "https://tvoyhod.online/"
}

export interface BotLog {
  id: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'system' | 'error';
  text: string;
}

export interface AppDatabase {
  users: VKUser[];
  surveys: Survey[];
  logs: BotLog[];
  settings: AppSettings;
  reminderLogs: ReminderLog[];
}
