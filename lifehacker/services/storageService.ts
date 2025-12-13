
import { DailyPlan, Dream, FinanceState, ListItem, MasteryGoal, WorkExpenseRecord } from '../types';

const DB_NAME = 'EssenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'essence_store';

// Legacy keys for migration
const KEYS = {
  RECORDS: 'essence_records',
  NOT_TO_DO: 'essence_not_to_do',
  SUCCESS: 'essence_success',
  IDEAS: 'essence_ideas',
  INSPIRATION: 'essence_inspiration',
  DREAMS: 'essence_dreams',
  FINANCE: 'essence_finance_v2',
  PLANS: 'essence_plans',
  MASTERY_GOALS: 'essence_mastery_goals', // New Key
};

// Internal Helper to interact with IndexedDB
const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };

  request.onsuccess = async (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    
    // --- MIGRATION LOGIC: Check if we need to migrate from LocalStorage ---
    try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                // DB is empty, let's check LocalStorage for legacy data
                const migrationData: Record<string, any> = {};
                let hasData = false;
                
                Object.values(KEYS).forEach(key => {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        try {
                            migrationData[key] = JSON.parse(raw);
                            hasData = true;
                        } catch (e) {
                            console.error(`Failed to parse legacy data for ${key}`, e);
                        }
                    }
                });

                if (hasData) {
                    console.log("System: Migrating legacy data from LocalStorage to IndexedDB...");
                    const writeTx = db.transaction(STORE_NAME, 'readwrite');
                    const writeStore = writeTx.objectStore(STORE_NAME);
                    
                    Object.entries(migrationData).forEach(([key, value]) => {
                        writeStore.put(value, key);
                    });

                    writeTx.oncomplete = () => {
                        console.log("System: Migration complete.");
                        // We intentionally DO NOT clear LocalStorage immediately to act as a fail-safe backup
                        // for the first few versions of the transition.
                    };
                }
            }
        };
    } catch (e) {
        console.error("Migration check failed", e);
    }
    // --- MIGRATION END ---

    resolve(db);
  };

  request.onerror = (event) => {
    reject((event.target as IDBOpenDBRequest).error);
  };
});

// Generic Get/Set helpers
const get = async <T>(key: string, defaultValue: T): Promise<T> => {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result === undefined ? defaultValue : request.result);
    };
    request.onerror = () => reject(request.error);
  });
};

const set = async (key: string, value: any): Promise<void> => {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const StorageService = {
  getRecords: () => get<WorkExpenseRecord[]>(KEYS.RECORDS, []),
  saveRecord: async (record: WorkExpenseRecord) => {
    const data = await StorageService.getRecords();
    await set(KEYS.RECORDS, [...data, record]);
  },
  deleteRecord: async (id: string) => {
    const data = await StorageService.getRecords();
    await set(KEYS.RECORDS, data.filter(r => r.id !== id));
  },

  getList: (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION') => {
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;
    return get<ListItem[]>(storageKey, []);
  },
  saveListItem: async (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION', item: ListItem) => {
    const data = await StorageService.getList(key);
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;
    await set(storageKey, [...data, item]);
  },
  deleteListItem: async (key: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION', id: string) => {
    const data = await StorageService.getList(key);
    let storageKey = KEYS.NOT_TO_DO;
    if (key === 'SUCCESS') storageKey = KEYS.SUCCESS;
    if (key === 'IDEAS') storageKey = KEYS.IDEAS;
    if (key === 'INSPIRATION') storageKey = KEYS.INSPIRATION;
    await set(storageKey, data.filter(i => i.id !== id));
  },

  getDreams: () => get<Dream[]>(KEYS.DREAMS, []),
  saveDream: async (dream: Dream) => {
    const data = await StorageService.getDreams();
    await set(KEYS.DREAMS, [...data, dream]);
  },
  deleteDream: async (id: string) => {
    const data = await StorageService.getDreams();
    await set(KEYS.DREAMS, data.filter(d => d.id !== id));
  },

  getFinance: () => {
    const defaultState: FinanceState = {
      totalIncome: 0,
      ratios: { fixed: 30, dream: 20, desire: 50 },
      allocations: { fixedSavings: 0, dreamSavings: 0, desireSpending: 0 }
    };
    return get<FinanceState>(KEYS.FINANCE, defaultState);
  },
  saveFinance: (state: FinanceState) => set(KEYS.FINANCE, state),

  getPlan: async (date: string): Promise<DailyPlan | null> => {
    const allPlans = await get<Record<string, DailyPlan>>(KEYS.PLANS, {});
    return allPlans[date] || null;
  },
  savePlan: async (plan: DailyPlan) => {
    const allPlans = await get<Record<string, DailyPlan>>(KEYS.PLANS, {});
    allPlans[plan.date] = plan;
    await set(KEYS.PLANS, allPlans);
  },
  savePlansBulk: async (plans: DailyPlan[]) => {
    const allPlans = await get<Record<string, DailyPlan>>(KEYS.PLANS, {});
    plans.forEach(plan => {
      // If plan exists for this date, merge tasks; otherwise create new
      const existing = allPlans[plan.date];
      if (existing) {
        // Prevent duplicate task text for the same day
        const existingTexts = new Set(existing.tasks.map(t => t.text));
        const uniqueNewTasks = plan.tasks.filter(t => !existingTexts.has(t.text));
        
        allPlans[plan.date] = {
          ...existing,
          tasks: [...existing.tasks, ...uniqueNewTasks]
        };
      } else {
        allPlans[plan.date] = plan;
      }
    });
    await set(KEYS.PLANS, allPlans);
  },
  
  // NEW: Get statistics of tasks starting from a specific date (TODAY onwards)
  getFutureTaskStats: async (fromDate: string) => {
      const allPlans = await get<Record<string, DailyPlan>>(KEYS.PLANS, {});
      const stats: Record<string, number> = {};
      
      Object.values(allPlans).forEach(plan => {
          // Compare ISO date strings: "2023-10-10" >= "2023-10-10" works alphabetically
          if (plan.date >= fromDate) {
              plan.tasks.forEach(t => {
                  const txt = t.text.trim();
                  if (txt) {
                    stats[txt] = (stats[txt] || 0) + 1;
                  }
              });
          }
      });
      // Return array sorted by count desc
      return Object.entries(stats)
          .map(([text, count]) => ({ text, count }))
          .sort((a, b) => b.count - a.count);
  },

  // NEW: Bulk Delete Future Plans (Today + Future)
  deleteTasksFromDate: async (taskTexts: string[], fromDate: string) => {
      const allPlans = await get<Record<string, DailyPlan>>(KEYS.PLANS, {});
      let hasChanges = false;
      const targetSet = new Set(taskTexts);

      Object.keys(allPlans).forEach(dateStr => {
          // Only modify plans if date is today or in the future
          if (dateStr >= fromDate) {
            const plan = allPlans[dateStr];
            const originalLength = plan.tasks.length;
            
            // Filter out tasks that are in the targetSet
            const newTasks = plan.tasks.filter(t => !targetSet.has(t.text.trim()));

            if (newTasks.length !== originalLength) {
                allPlans[dateStr] = {
                    ...plan,
                    tasks: newTasks
                };
                hasChanges = true;
            }
          }
      });

      if (hasChanges) {
          await set(KEYS.PLANS, allPlans);
      }
      return hasChanges;
  },

  // Keep legacy for safety/compatibility if needed, but unused now
  getTaskStats: async (startDate: string, endDate: string) => {
    return StorageService.getFutureTaskStats(startDate); 
  },
  getAllTaskStats: async () => {
    return StorageService.getFutureTaskStats('1900-01-01');
  },

  getAllPlans: () => get<Record<string, DailyPlan>>(KEYS.PLANS, {}),

  // Mastery Goals
  getMasteryGoals: () => get<MasteryGoal[]>(KEYS.MASTERY_GOALS, []),
  saveMasteryGoal: async (goal: MasteryGoal) => {
    const data = await StorageService.getMasteryGoals();
    // Check if exists to update, else append
    const exists = data.some(g => g.id === goal.id);
    if (exists) {
        await set(KEYS.MASTERY_GOALS, data.map(g => g.id === goal.id ? goal : g));
    } else {
        await set(KEYS.MASTERY_GOALS, [...data, goal]);
    }
  },
  deleteMasteryGoal: async (id: string) => {
    const data = await StorageService.getMasteryGoals();
    await set(KEYS.MASTERY_GOALS, data.filter(g => g.id !== id));
  },

  // New Helper for Data Backup to get everything at once
  getAllData: async () => {
    const keys = Object.values(KEYS);
    const data: Record<string, any> = {};
    for (const key of keys) {
        data[key] = await get(key, null);
    }
    return data;
  },
  restoreAllData: async (jsonData: any) => {
     for (const [key, value] of Object.entries(jsonData)) {
         if (Object.values(KEYS).includes(key)) {
             await set(key, value);
         }
     }
  }
};

