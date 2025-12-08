export enum RecordType {
  WORK = 'WORK',
  EXPENSE = 'EXPENSE'
}

export interface WorkExpenseRecord {
  id: string;
  type: RecordType;
  value: number; // Hours or Money
  category: string;
  date: string; // ISO Date string
  note?: string;
}

export interface ListItem {
  id: string;
  text: string;
  createdAt: string;
  category?: string; // For Inspiration: 'sentence', 'book', 'article'
  author?: string;   // Optional metadata
  content?: string;  // Optional: For Article paragraphs/body
}

export interface Dream {
  id: string;
  imageUrl: string; // Base64 or URL
  title: string;
}

export interface FinanceState {
  totalIncome: number;
  ratios: {
    fixed: number; // Percentage 0-100
    dream: number; // Percentage 0-100
    desire: number; // Percentage 0-100
  };
  // Calculated values are derived, but we can store them for persistence convenience.
  allocations: {
    fixedSavings: number;
    dreamSavings: number;
    desireSpending: number;
  };
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  tasks: DailyTask[];
  review: string;
  harvest: string; // "收获"
}

export type PageView = 
  | 'dreams_view' 
  | 'dreams_manage' 
  | 'plan' 
  | 'finance' 
  | 'work' 
  | 'expense'
  | 'list_not_todo'
  | 'list_success'
  | 'list_ideas'
  | 'list_inspiration'
  | 'data_backup';