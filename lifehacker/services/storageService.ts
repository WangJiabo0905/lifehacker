import { DailyPlan, Dream, FinanceState, ListItem, WorkExpenseRecord } from '../types';

const KEYS = {
  RECORDS: 'essence_records',
  NOT_TO_DO: 'essence_not_to_do',
  SUCCESS: 'essence_success',
  IDEAS: 'essence_ideas',
  INSPIRATION: 'essence_inspiration',
  DREAMS: 'essence_dreams',
  FINANCE: 'essence_finance_v2',
  PLANS: 'essence_plans',
};

export const StorageService = {
  getRecords: (): WorkExpenseRecord[] => JSON.parse(localStorage.getItem(KEYS.RECORDS) || '[]'),
  saveRecord: (record: WorkExpenseRecord) => {
    const data = StorageService.getRecords();
    localStorage.setItem(KEYS.RECORDS, JSON.stringify([...data, record]));
  },
  deleteRecord: (id: string) => {
    const data = StorageService.getRecords();
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(data.filter(r => r.id !== id)));
  },

  getList: (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION'): ListItem[] => {
    // For INSPIRATION, we use a new key, others match the enum-like strings used in pages
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;
    
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  },
  saveListItem: (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION', item: ListItem) => {
    const data = StorageService.getList(key);
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;

    localStorage.setItem(storageKey, JSON.stringify([...data, item]));
  },
  deleteListItem: (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION', id: string) => {
    const data = StorageService.getList(key);
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;
    
    localStorage.setItem(storageKey, JSON.stringify(data.filter(i => i.id !== id)));
  },

  getDreams: (): Dream[] => JSON.parse(localStorage.getItem(KEYS.DREAMS) || '[]'),
  saveDream: (dream: Dream) => {
    const data = StorageService.getDreams();
    localStorage.setItem(KEYS.DREAMS, JSON.stringify([...data, dream]));
  },

  getFinance: (): FinanceState => {
    const defaultState: FinanceState = {
      totalIncome: 0,
      ratios: { fixed: 30, dream: 20, desire: 50 },
      allocations: { fixedSavings: 0, dreamSavings: 0, desireSpending: 0 }
    };
    return JSON.parse(localStorage.getItem(KEYS.FINANCE) || JSON.stringify(defaultState));
  },
  saveFinance: (state: FinanceState) => localStorage.setItem(KEYS.FINANCE, JSON.stringify(state)),

  getPlan: (date: string): DailyPlan | null => {
    const allPlans = JSON.parse(localStorage.getItem(KEYS.PLANS) || '{}');
    return allPlans[date] || null;
  },
  savePlan: (plan: DailyPlan) => {
    const allPlans = JSON.parse(localStorage.getItem(KEYS.PLANS) || '{}');
    allPlans[plan.date] = plan;
    localStorage.setItem(KEYS.PLANS, JSON.stringify(allPlans));
  },
  getAllPlans: (): Record<string, DailyPlan> => {
    return JSON.parse(localStorage.getItem(KEYS.PLANS) || '{}');
  }
};