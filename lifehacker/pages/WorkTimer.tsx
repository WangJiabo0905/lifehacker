
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RecordType, WorkExpenseRecord, MasteryGoal } from '../types';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, Pause, Square, Save, Clock, Info, ChevronLeft, ChevronRight, 
  Calendar, Zap, Minus, TrendingUp, TrendingDown, Target, Plus, X, 
  Award, Sparkles, Tag, AlertTriangle, Trash2, CheckCircle, ShieldAlert
} from 'lucide-react';

const TIMER_KEYS = {
  STATUS: 'essence_timer_status', 
  START_TIME: 'essence_timer_start_time',
  ACCUMULATED: 'essence_timer_accumulated',
  CATEGORY: 'essence_timer_category',
  NOTE: 'essence_timer_note'
};

const MASTERY_LEVELS = [
  { limit: 100, label: 'Novice', title: '新手' },
  { limit: 1000, label: 'Apprentice', title: '学徒' },
  { limit: 5000, label: 'Specialist', title: '专家' },
  { limit: 10000, label: 'Master', title: '大师' },
  { limit: Infinity, label: 'Legend', title: '传奇' },
];

const DEFAULT_KEYWORDS = ["Deep Work", "Reading", "Coding", "Writing", "Exercise", "Meeting", "English", "Piano"];

export const WorkTimerPage: React.FC = () => {
  const [records, setRecords] = useState<WorkExpenseRecord[]>([]);
  const [masteryGoals, setMasteryGoals] = useState<MasteryGoal[]>([]);
  
  // Timer State
  const [timerStatus, setTimerStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE');
  const [seconds, setSeconds] = useState(0);
  const [category, setCategory] = useState('Deep Work');
  const [note, setNote] = useState('');
  
  // UI State for Mastery
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', query: '' });
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);

  // UI State for Deletion Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, step: 1 | 2 | 3, goal: MasteryGoal | null, input: string }>({
      open: false, step: 1, goal: null, input: ''
  });

  // Helper to get Local YYYY-MM-DD string
  const toLocalYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getToday = () => toLocalYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(getToday());
  
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    const [recs, goals] = await Promise.all([
        StorageService.getRecords(),
        StorageService.getMasteryGoals()
    ]);
    setRecords(recs);
    setMasteryGoals(goals);
  }, []);

  useEffect(() => {
    loadData();

    // Timer Recovery Logic
    const savedStatus = localStorage.getItem(TIMER_KEYS.STATUS) as 'IDLE' | 'RUNNING' | 'PAUSED' | null;
    const savedCategory = localStorage.getItem(TIMER_KEYS.CATEGORY);
    const savedNote = localStorage.getItem(TIMER_KEYS.NOTE);

    if (savedCategory) setCategory(savedCategory);
    if (savedNote) setNote(savedNote);

    if (savedStatus === 'RUNNING') {
      setTimerStatus('RUNNING');
      tick(); 
      timerIntervalRef.current = setInterval(tick, 1000);
    } else if (savedStatus === 'PAUSED') {
      setTimerStatus('PAUSED');
      const acc = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
      setSeconds(acc);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Extract suggestions when records change
  useEffect(() => {
    if (records.length > 0) {
        const uniqueCats = new Set<string>();
        records.forEach(r => {
            if (r.type === RecordType.WORK) {
                if (r.category) uniqueCats.add(r.category);
                if (r.note && r.note.length > 1 && r.note.length < 15) uniqueCats.add(r.note);
            }
        });
        setSuggestedKeywords(Array.from(uniqueCats));
    }
  }, [records]);

  const tick = useCallback(() => {
    const startTimeStr = localStorage.getItem(TIMER_KEYS.START_TIME);
    const accumulatedStr = localStorage.getItem(TIMER_KEYS.ACCUMULATED);

    const startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
    const accumulated = accumulatedStr ? parseInt(accumulatedStr, 10) : 0;
    
    const now = Date.now();
    const currentSegmentSeconds = Math.floor((now - startTime) / 1000);
    setSeconds(accumulated + currentSegmentSeconds);
  }, []);

  // --- TIMER ACTIONS ---
  const handleStart = () => {
    const now = Date.now();
    localStorage.setItem(TIMER_KEYS.STATUS, 'RUNNING');
    localStorage.setItem(TIMER_KEYS.START_TIME, now.toString());
    if (!localStorage.getItem(TIMER_KEYS.ACCUMULATED)) {
        localStorage.setItem(TIMER_KEYS.ACCUMULATED, '0');
    }

    setTimerStatus('RUNNING');
    timerIntervalRef.current = setInterval(tick, 1000);
  };

  const handlePause = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    const startTime = parseInt(localStorage.getItem(TIMER_KEYS.START_TIME) || Date.now().toString(), 10);
    const previouslyAccumulated = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
    const currentSegment = Math.floor((Date.now() - startTime) / 1000);
    const newTotal = previouslyAccumulated + currentSegment;

    localStorage.setItem(TIMER_KEYS.STATUS, 'PAUSED');
    localStorage.setItem(TIMER_KEYS.ACCUMULATED, newTotal.toString());
    localStorage.removeItem(TIMER_KEYS.START_TIME);

    setSeconds(newTotal);
    setTimerStatus('PAUSED');
  };

  const handleFinish = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    let finalSeconds = seconds;
    if (timerStatus === 'RUNNING') {
        const startTime = parseInt(localStorage.getItem(TIMER_KEYS.START_TIME) || Date.now().toString(), 10);
        const previouslyAccumulated = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
        finalSeconds = previouslyAccumulated + Math.floor((Date.now() - startTime) / 1000);
    }

    if (finalSeconds < 60) {
      alert("记录时间太短 (少于1分钟)，建议继续工作或取消。");
      return; 
    }

    const hours = parseFloat((finalSeconds / 3600).toFixed(2));
    const newRecord: WorkExpenseRecord = {
      id: Date.now().toString(),
      type: RecordType.WORK,
      value: hours,
      category,
      date: new Date().toISOString(),
      note: note || '计时会话'
    };
    
    await StorageService.saveRecord(newRecord);
    setRecords(prev => [...prev, newRecord]);

    // Check Mastery Progress Feedback
    const impactedGoals = masteryGoals.filter(g => {
        const keywords = g.query.split(',').map(k => k.trim().toLowerCase());
        const matchText = (newRecord.category + ' ' + (newRecord.note || '')).toLowerCase();
        return keywords.some(k => matchText.includes(k));
    });

    if (impactedGoals.length > 0) {
        const titles = impactedGoals.map(g => `【${g.title}】`).join(' ');
        alert(`🎉 恭喜！本次专注为 ${titles} 积累了 ${hours} 小时经验值！`);
    }

    hardReset();
  };

  const hardReset = () => {
    localStorage.removeItem(TIMER_KEYS.STATUS);
    localStorage.removeItem(TIMER_KEYS.START_TIME);
    localStorage.removeItem(TIMER_KEYS.ACCUMULATED);
    localStorage.removeItem(TIMER_KEYS.CATEGORY);
    localStorage.removeItem(TIMER_KEYS.NOTE);

    setSeconds(0);
    setNote('');
    setTimerStatus('IDLE');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // --- MASTERY LOGIC ---
  const calculateMastery = (goal: MasteryGoal) => {
    const keywords = goal.query.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywords.length === 0) return 0;

    const relevantRecords = records.filter(r => {
        if (r.type !== RecordType.WORK) return false;
        const text = (r.category + ' ' + (r.note || '')).toLowerCase();
        return keywords.some(k => text.includes(k));
    });
    return relevantRecords.reduce((acc, curr) => acc + curr.value, 0);
  };

  const getLevelInfo = (hours: number) => {
      for (let i = 0; i < MASTERY_LEVELS.length; i++) {
          if (hours < MASTERY_LEVELS[i].limit) {
              const prevLimit = i === 0 ? 0 : MASTERY_LEVELS[i-1].limit;
              const nextLimit = MASTERY_LEVELS[i].limit;
              const progressInLevel = hours - prevLimit;
              const levelSpan = nextLimit - prevLimit;
              const percent = (progressInLevel / levelSpan) * 100;
              return { 
                  current: MASTERY_LEVELS[i].label, 
                  title: MASTERY_LEVELS[i].title,
                  next: MASTERY_LEVELS[i+1]?.title || 'Max',
                  progressPercent: Math.min(100, Math.max(0, percent)),
                  hoursToNext: nextLimit - hours
              };
          }
      }
      return { current: 'Legend', title: '传奇', next: '-', progressPercent: 100, hoursToNext: 0 };
  };

  const saveGoal = async () => {
      if(!goalForm.title || !goalForm.query) return;
      const newGoal: MasteryGoal = {
          id: Date.now().toString(),
          title: goalForm.title,
          query: goalForm.query,
          createdAt: new Date().toISOString()
      };
      await StorageService.saveMasteryGoal(newGoal);
      setMasteryGoals(prev => [...prev, newGoal]);
      setGoalForm({ title: '', query: '' });
      setIsAddingGoal(false);
      setCurrentGoalIndex(masteryGoals.length); 
  };

  const addKeyword = (keyword: string) => {
      const current = goalForm.query.trim();
      if (!current) {
          setGoalForm(prev => ({ ...prev, query: keyword }));
      } else {
          const exists = current.split(',').map(s => s.trim().toLowerCase()).includes(keyword.toLowerCase());
          if (!exists) {
              setGoalForm(prev => ({ ...prev, query: current + ', ' + keyword }));
          }
      }
  };

  // --- MATCHING FEEDBACK ---
  const getMatchingGoals = () => {
      if (!category && !note) return [];
      const matchText = (category + ' ' + note).toLowerCase();
      return masteryGoals.filter(g => {
          const keywords = g.query.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
          return keywords.some(k => matchText.includes(k));
      });
  };
  const matchedGoals = getMatchingGoals();

  // --- DELETION FLOW ---
  const initiateDelete = (goal: MasteryGoal) => {
      setDeleteModal({ open: true, step: 1, goal, input: '' });
  };

  const confirmDeleteStep = async () => {
      if (deleteModal.step === 1) {
          setDeleteModal(prev => ({ ...prev, step: 2 }));
      } else if (deleteModal.step === 2) {
          setDeleteModal(prev => ({ ...prev, step: 3 }));
      } else if (deleteModal.step === 3) {
          if (deleteModal.input === 'DELETE') {
              if (deleteModal.goal) {
                  await StorageService.deleteMasteryGoal(deleteModal.goal.id);
                  setMasteryGoals(prev => prev.filter(g => g.id !== deleteModal.goal!.id));
                  setCurrentGoalIndex(0);
                  setDeleteModal({ open: false, step: 1, goal: null, input: '' });
              }
          }
      }
  };

  // --- EXISTING CHART LOGIC ---
  const workRecords = records.filter(r => r.type === RecordType.WORK);
  const getRecordDateStr = (dateString: string) => toLocalYMD(new Date(dateString));

  const selectedDayTotal = workRecords
    .filter(r => getRecordDateStr(r.date) === selectedDate)
    .reduce((a, b) => a + b.value, 0);

  const selectedDayLogs = workRecords
    .filter(r => getRecordDateStr(r.date) === selectedDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatsForPeriod = (startStr: string, endStr: string) => { 
     const filtered = workRecords.filter(r => {
        const d = getRecordDateStr(r.date);
        return d >= startStr && d <= endStr;
     });
     const total = filtered.reduce((a, b) => a + b.value, 0);
     const uniqueDays = new Set(filtered.map(r => getRecordDateStr(r.date))).size;
     return { total, avg: uniqueDays > 0 ? total / uniqueDays : 0 };
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const weekStart = new Date(selectedDateObj); weekStart.setDate(weekStart.getDate() - 6);
  const statsCurrentWeek = getStatsForPeriod(toLocalYMD(weekStart), selectedDate);

  const prevWeekEnd = new Date(weekStart); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd); prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  const statsPrevWeek = getStatsForPeriod(toLocalYMD(prevWeekStart), toLocalYMD(prevWeekEnd));

  const weekDiff = statsCurrentWeek.total - statsPrevWeek.total;
  const weekDiffPercent = statsPrevWeek.total > 0 ? (weekDiff / statsPrevWeek.total) * 100 : 0;

  const chartData = Array.from({length: 7}, (_, i) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - (6 - i));
    const labelDate = toLocalYMD(d); 
    const dailyTotal = workRecords
      .filter(r => getRecordDateStr(r.date) === labelDate)
      .reduce((acc, curr) => acc + curr.value, 0);
    return { date: labelDate.slice(5), hours: dailyTotal };
  });

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(toLocalYMD(d));
  };
  const isTodaySelected = selectedDate === getToday();

  // --- RENDER HELPERS ---
  const currentGoal = masteryGoals[currentGoalIndex];
  const currentGoalTotal = currentGoal ? calculateMastery(currentGoal) : 0;
  const levelInfo = getLevelInfo(currentGoalTotal);
  
  const keywordsToDisplay = suggestedKeywords.length > 0 ? suggestedKeywords : DEFAULT_KEYWORDS;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12 relative">
      
      {/* --- DELETION MODAL --- */}
      {deleteModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all">
                  
                  {/* Step 1: Confirm */}
                  {deleteModal.step === 1 && (
                      <div className="p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto text-white">
                              <Trash2 size={24} />
                          </div>
                          <div>
                              <h3 className="text-white text-lg font-bold">删除目标?</h3>
                              <p className="text-gray-400 text-sm mt-2">
                                  确认要删除 <span className="text-white font-bold">"{deleteModal.goal?.title}"</span> 吗?
                              </p>
                          </div>
                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setDeleteModal(prev => ({...prev, open: false}))} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors">取消</button>
                              <button onClick={confirmDeleteStep} className="flex-1 bg-[#8E5E73] hover:bg-[#7a4f61] text-white py-3 rounded-xl font-medium transition-colors">下一步</button>
                          </div>
                      </div>
                  )}

                  {/* Step 2: Warning */}
                  {deleteModal.step === 2 && (
                      <div className="p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto text-orange-500 animate-pulse">
                              <AlertTriangle size={24} />
                          </div>
                          <div>
                              <h3 className="text-white text-lg font-bold">严重警告</h3>
                              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                  删除后，该目标积累的 <span className="text-orange-400 font-mono">{currentGoalTotal.toFixed(1)}</span> 小时经验值将被永久移除且<span className="text-white font-bold underline">无法恢复</span>。
                              </p>
                          </div>
                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setDeleteModal(prev => ({...prev, open: false}))} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors">我后悔了</button>
                              <button onClick={confirmDeleteStep} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition-colors">继续删除</button>
                          </div>
                      </div>
                  )}

                  {/* Step 3: Challenge */}
                  {deleteModal.step === 3 && (
                      <div className="p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                              <ShieldAlert size={24} />
                          </div>
                          <div>
                              <h3 className="text-white text-lg font-bold">最后确认</h3>
                              <p className="text-gray-400 text-sm mt-2">
                                  请输入 <span className="bg-white/10 px-1 rounded font-mono text-white">DELETE</span> 以确认操作。
                              </p>
                          </div>
                          <input 
                              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-white outline-none focus:border-red-500 transition-colors uppercase placeholder:text-gray-600"
                              placeholder="DELETE"
                              value={deleteModal.input}
                              onChange={(e) => setDeleteModal(prev => ({...prev, input: e.target.value.toUpperCase()}))}
                          />
                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setDeleteModal(prev => ({...prev, open: false}))} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors">取消</button>
                              <button 
                                disabled={deleteModal.input !== 'DELETE'}
                                onClick={confirmDeleteStep} 
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${deleteModal.input === 'DELETE' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                              >
                                  永久删除
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">工作计时</h2>
              <div className="group relative">
                  <Info size={18} className="text-white/50 cursor-help" />
                  <div className="absolute left-full top-0 ml-2 w-64 p-3 bg-black/90 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-light">
                      一万小时定律：基于历史数据中的分类和备注关键词，追溯计算您的技能积累时长。
                  </div>
              </div>
          </div>
          <p className="text-white/70 mt-1">记录专注时刻，累积心流体验。</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
             <button onClick={() => changeDate(-1)} className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={20}/></button>
             <div className="relative group flex items-center gap-2 text-white">
               <Calendar size={16} className="opacity-80"/>
               <input 
                 type="date" 
                 value={selectedDate} 
                 onChange={(e) => setSelectedDate(e.target.value)} 
                 className="bg-transparent border-none font-medium outline-none focus:ring-0 cursor-pointer text-base w-32"
               />
             </div>
             <button onClick={() => changeDate(1)} disabled={isTodaySelected} className={`p-1 text-white rounded-full transition-colors ${isTodaySelected ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}><ChevronRight size={20}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: TIMER */}
        <div className={`bg-white p-8 rounded-3xl shadow-lg border border-white/20 flex flex-col items-center justify-center min-h-[400px] transition-all relative overflow-hidden ${!isTodaySelected ? 'opacity-90 grayscale-[0.5]' : ''}`}>
          
          {timerStatus === 'RUNNING' && isTodaySelected && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#8E5E73]/10 px-3 py-1 rounded-full animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#8E5E73]"></div>
                  <span className="text-xs font-bold text-[#8E5E73] uppercase tracking-wider">Recording</span>
              </div>
          )}

          {!isTodaySelected && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-3xl">
                  <Clock size={48} className="text-[#8E5E73] mb-4 opacity-50"/>
                  <p className="text-[#8E5E73] font-medium">您正在查看历史记录</p>
                  <button onClick={() => setSelectedDate(getToday())} className="mt-2 text-sm underline text-gray-500 hover:text-gray-800">回到今天进行计时</button>
              </div>
          )}

          <div className="text-xs font-medium text-[#8E5E73] mb-2 bg-[#8E5E73]/10 px-3 py-1 rounded-full">
            {selectedDate} 已工作: {selectedDayTotal.toFixed(2)} 小时
          </div>
          
          <div className="text-7xl font-mono font-light tracking-tighter text-gray-900 mb-8 tabular-nums relative">
            {isTodaySelected ? ((a)=>{
                const h = Math.floor(a/3600).toString().padStart(2,'0');
                const m = Math.floor((a%3600)/60).toString().padStart(2,'0');
                const s = (a%60).toString().padStart(2,'0');
                return `${h}:${m}:${s}`;
            })(seconds) : '00:00:00'}
            {timerStatus === 'PAUSED' && isTodaySelected && <span className="absolute -right-6 top-0 text-xs text-orange-400 font-bold uppercase">Paused</span>}
          </div>
          
          <div className="w-full space-y-4 mb-8 relative">
             <select 
               value={category} 
               onChange={(e) => {
                   setCategory(e.target.value);
                   localStorage.setItem(TIMER_KEYS.CATEGORY, e.target.value);
               }}
               className="w-full bg-[#F5F5F7] p-3 rounded-xl text-center outline-none text-gray-700 focus:ring-2 focus:ring-[#8E5E73]/20 transition-all appearance-none font-medium"
               disabled={!isTodaySelected}
             >
                <option value="Deep Work">⚡ 深度工作 (Deep Work)</option>
                <option value="Meeting">📅 会议 (Meeting)</option>
                <option value="Learning">📚 学习 (Learning)</option>
                <option value="Creation">🎨 创作 (Creation)</option>
                <option value="Coding">💻 编程 (Coding)</option>
                <option value="Reading">📖 阅读 (Reading)</option>
             </select>
             <input 
               type="text" 
               placeholder="备注 (关联精进项目的关键词)..."
               value={note}
               onChange={(e) => {
                   setNote(e.target.value);
                   localStorage.setItem(TIMER_KEYS.NOTE, e.target.value);
               }}
               className="w-full bg-transparent border-b border-gray-200 p-2 text-center outline-none focus:border-[#8E5E73] transition-colors text-gray-800"
               disabled={!isTodaySelected}
             />

             {/* Match Feedback Indicator */}
             <div className={`text-center text-xs transition-opacity duration-300 min-h-[20px] ${matchedGoals.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                {matchedGoals.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                        <CheckCircle size={10} />
                        <span>Accumulating to: </span>
                        <span className="font-bold">{matchedGoals.map(g => g.title).join(', ')}</span>
                    </div>
                )}
             </div>
          </div>

          <div className="flex gap-4 w-full">
            {timerStatus === 'RUNNING' ? (
                <button 
                onClick={handlePause}
                className="flex-1 bg-orange-50 text-orange-600 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors"
                >
                <Pause size={18} fill="currentColor"/> 暂停
                </button>
            ) : (
                <button 
                onClick={handleStart}
                disabled={!isTodaySelected}
                className="flex-1 bg-[#8E5E73] text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#7a4f61] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                <Play size={18} fill="currentColor"/> {timerStatus === 'PAUSED' ? '继续' : '开始'}
                </button>
            )}

            {(seconds > 0) && (
              <button 
                onClick={handleFinish}
                className="flex-1 bg-green-50 text-green-700 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
              >
                <Save size={18} /> 完成
              </button>
            )}
            
            {(timerStatus !== 'IDLE' || seconds > 0) && (
                <button 
                    onClick={() => {
                        if(confirm("确定要放弃当前的计时吗？数据将不会被保存。")) hardReset();
                    }}
                    className="px-4 text-gray-300 hover:text-red-400 transition-colors"
                    title="重置/放弃"
                >
                    <Square size={18} />
                </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MASTERY & STATS */}
        <div className="flex flex-col gap-6">
           
           {/* MASTERY CARD */}
           <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] p-6 rounded-3xl shadow-xl border border-white/5 text-white relative overflow-hidden min-h-[240px]">
              
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8E5E73] opacity-20 blur-3xl rounded-full pointer-events-none"></div>

              {isAddingGoal ? (
                  <div className="animate-fade-in h-full flex flex-col relative z-10">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold">新建精进项目</h3>
                          <button onClick={() => setIsAddingGoal(false)}><X size={18}/></button>
                      </div>
                      <input 
                        className="bg-white/10 border-none rounded-lg p-3 text-white mb-3 outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                        placeholder="项目名称 (如: 钢琴演奏)"
                        value={goalForm.title}
                        onChange={e => setGoalForm({...goalForm, title: e.target.value})}
                      />
                      <input 
                        className="bg-white/10 border-none rounded-lg p-3 text-white mb-2 outline-none focus:bg-white/20 transition-all placeholder:text-white/30 text-sm"
                        placeholder="关键词 (逗号分隔，如: Piano, Music)"
                        value={goalForm.query}
                        onChange={e => setGoalForm({...goalForm, query: e.target.value})}
                      />
                      
                      {/* Keyword Suggestions Panel */}
                      <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-white/50 mb-2 flex items-center gap-1 font-semibold uppercase tracking-wider">
                              <Tag size={10}/> 
                              {suggestedKeywords.length > 0 ? "历史关键词 (点击添加)" : "推荐关键词 (点击添加)"}
                          </p>
                          <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar">
                              {keywordsToDisplay.map(k => (
                                  <button 
                                    key={k}
                                    type="button"
                                    onClick={() => addKeyword(k)}
                                    className="text-xs bg-white/10 hover:bg-[#8E5E73] hover:text-white px-3 py-1.5 rounded-full transition-colors text-white/80 border border-white/5"
                                  >
                                      {k}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={saveGoal}
                        disabled={!goalForm.title || !goalForm.query}
                        className={`mt-auto w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${(!goalForm.title || !goalForm.query) ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-[#8E5E73] hover:bg-[#7a4f61]'}`}
                      >
                          <Plus size={16}/> 创建项目
                      </button>
                  </div>
              ) : (
                masteryGoals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-4 relative z-10">
                        <Target className="text-[#8E5E73] w-12 h-12" />
                        <div>
                            <p className="font-bold text-lg">开启大师之路</p>
                            <p className="text-white/50 text-sm max-w-[200px] mx-auto mt-1">设定一个目标，通过一万小时的积累成为该领域的专家。</p>
                        </div>
                        <button onClick={() => setIsAddingGoal(true)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-sm font-medium transition-colors">
                            + 添加目标
                        </button>
                    </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-2">
                             <Award className="text-yellow-500" size={20} />
                             <div className="flex flex-col">
                                <span className="font-bold text-lg tracking-wide">{currentGoal?.title}</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {currentGoal?.query.split(',').map(k => (
                                        <span key={k} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{k.trim()}</span>
                                    ))}
                                </div>
                             </div>
                        </div>
                        
                        <div className="flex gap-1 items-center">
                             <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white/60 uppercase tracking-widest mr-2">{levelInfo.title}</span>
                             <button 
                                onClick={() => setCurrentGoalIndex(i => (i - 1 + masteryGoals.length) % masteryGoals.length)}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                             >
                                 <ChevronLeft size={16}/>
                             </button>
                             <button 
                                onClick={() => setCurrentGoalIndex(i => (i + 1) % masteryGoals.length)}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                             >
                                 <ChevronRight size={16}/>
                             </button>
                             <button 
                                onClick={() => setIsAddingGoal(true)}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white ml-2"
                             >
                                 <Plus size={16}/>
                             </button>
                             <button 
                                onClick={() => currentGoal && initiateDelete(currentGoal)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors text-white/30 hover:text-red-400"
                                title="删除目标"
                             >
                                 <X size={16}/>
                             </button>
                        </div>
                    </div>

                    <div className="relative mb-6 z-10">
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-5xl font-light tracking-tighter">
                                {(currentGoalTotal / 10000 * 100).toFixed(3)}
                                <span className="text-lg text-white/40 ml-1">%</span>
                            </span>
                            <div className="text-right">
                                <div className="text-sm font-bold text-[#8E5E73]">{currentGoalTotal.toFixed(1)} h</div>
                                <div className="text-xs text-white/30">Total Invested</div>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#8E5E73] to-orange-400 transition-all duration-1000 ease-out"
                                style={{ width: `${levelInfo.progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-white/40 border-t border-white/10 pt-4 mt-auto relative z-10">
                        <div className="flex items-center gap-1">
                            <Sparkles size={12} className="text-yellow-500"/>
                            Next Level: <span className="text-white">{levelInfo.next}</span>
                        </div>
                        <div>
                            Need <span className="text-white font-mono">{levelInfo.hoursToNext.toFixed(1)}</span> more hours
                        </div>
                    </div>
                  </>
                )
              )}
           </div>

           {/* STATS - CURRENT WEEK */}
           <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                   <Zap size={20} className="text-[#8E5E73]" /> 周期对比
                 </h3>
                 <div className={`flex items-center gap-1 text-sm font-bold ${weekDiff >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {weekDiff >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    {Math.abs(weekDiff).toFixed(1)}h ({statsPrevWeek.total > 0 ? Math.abs(weekDiffPercent).toFixed(0) : '∞'}%)
                 </div>
              </div>
              <div className="flex gap-4 items-end justify-around text-center">
                 <div>
                    <div className="text-2xl font-bold text-gray-800">{statsCurrentWeek.total.toFixed(1)}h</div>
                    <div className="text-xs text-gray-400">{selectedDate.slice(5)} 这周</div>
                 </div>
                 <div className="text-gray-300 mb-2"><Minus /></div>
                 <div>
                    <div className="text-2xl font-bold text-gray-400">{statsPrevWeek.total.toFixed(1)}h</div>
                    <div className="text-xs text-gray-400">上周</div>
                 </div>
              </div>
           </div>

          {/* CHART */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20">
             <h3 className="font-semibold text-gray-700 mb-4">走势图 ({selectedDate.slice(0,4)})</h3>
             <div className="h-28">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                   <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                   <Bar dataKey="hours" fill="#8E5E73" radius={[4, 4, 4, 4]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20">
         <h3 className="font-semibold text-gray-700 mb-4">当日记录详情 ({selectedDate})</h3>
         <div className="space-y-3">
             {selectedDayLogs.length === 0 ? (
                 <div className="text-center text-gray-400 py-8 text-sm">当日无工作记录</div>
             ) : (
                 selectedDayLogs.map(log => (
                     <div key={log.id} className="flex justify-between items-center p-3 bg-[#F5F5F7] rounded-xl text-sm">
                         <div className="flex items-center gap-3">
                            <span className="font-mono text-gray-500">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="font-bold text-gray-800">{log.category}</span>
                            <span className="text-gray-500 truncate max-w-[150px]">{log.note}</span>
                         </div>
                         <div className="font-bold text-[#8E5E73]">{log.value}h</div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
};
