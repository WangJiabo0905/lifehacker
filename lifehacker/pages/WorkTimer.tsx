import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RecordType, WorkExpenseRecord } from '../types';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, Save, Clock, Info, ChevronLeft, ChevronRight, Calendar, Zap, Minus, TrendingUp, TrendingDown } from 'lucide-react';

// Keys for persistence
const TIMER_KEYS = {
  STATUS: 'essence_timer_status', // 'RUNNING' | 'PAUSED' | 'IDLE'
  START_TIME: 'essence_timer_start_time', // Timestamp when current segment started
  ACCUMULATED: 'essence_timer_accumulated', // Seconds accumulated before current segment
  CATEGORY: 'essence_timer_category',
  NOTE: 'essence_timer_note'
};

export const WorkTimerPage: React.FC = () => {
  const [records, setRecords] = useState<WorkExpenseRecord[]>([]);
  
  // Timer State
  const [timerStatus, setTimerStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE');
  const [seconds, setSeconds] = useState(0);
  const [category, setCategory] = useState('Deep Work');
  const [note, setNote] = useState('');
  
  // Date State for History Navigation
  const getTodayShifted = () => {
    const d = new Date();
    d.setHours(d.getHours() - 6);
    return d.toISOString().split('T')[0];
  };
  const [selectedDate, setSelectedDate] = useState(getTodayShifted());
  
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- 1. The Robust Tick Engine ---
  // Calculates time based on timestamps, not by counting seconds.
  // This makes it immune to browser throttling or page refreshes.
  const tick = useCallback(() => {
    const startTimeStr = localStorage.getItem(TIMER_KEYS.START_TIME);
    const accumulatedStr = localStorage.getItem(TIMER_KEYS.ACCUMULATED);

    const startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
    const accumulated = accumulatedStr ? parseInt(accumulatedStr, 10) : 0;
    
    const now = Date.now();
    const currentSegmentSeconds = Math.floor((now - startTime) / 1000);
    
    // Total seconds = Previously accumulated + Current segment
    setSeconds(accumulated + currentSegmentSeconds);
  }, []);

  // --- 2. Initialization & Recovery (The "Standby" Logic) ---
  useEffect(() => {
    setRecords(StorageService.getRecords());

    // Recover state from LocalStorage on mount
    const savedStatus = localStorage.getItem(TIMER_KEYS.STATUS) as 'IDLE' | 'RUNNING' | 'PAUSED' | null;
    const savedCategory = localStorage.getItem(TIMER_KEYS.CATEGORY);
    const savedNote = localStorage.getItem(TIMER_KEYS.NOTE);

    if (savedCategory) setCategory(savedCategory);
    if (savedNote) setNote(savedNote);

    if (savedStatus === 'RUNNING') {
      setTimerStatus('RUNNING');
      // Immediate tick to update UI
      tick(); 
      // Start loop
      timerIntervalRef.current = setInterval(tick, 1000);
    } else if (savedStatus === 'PAUSED') {
      setTimerStatus('PAUSED');
      const acc = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
      setSeconds(acc);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [tick]);

  // --- 3. Control Logic ---

  const handleStart = () => {
    const now = Date.now();
    localStorage.setItem(TIMER_KEYS.STATUS, 'RUNNING');
    localStorage.setItem(TIMER_KEYS.START_TIME, now.toString());
    // Preserve existing accumulated time if resuming
    if (!localStorage.getItem(TIMER_KEYS.ACCUMULATED)) {
        localStorage.setItem(TIMER_KEYS.ACCUMULATED, '0');
    }

    setTimerStatus('RUNNING');
    timerIntervalRef.current = setInterval(tick, 1000);
  };

  const handlePause = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    // Calculate final time for this segment and add to accumulated
    const startTime = parseInt(localStorage.getItem(TIMER_KEYS.START_TIME) || Date.now().toString(), 10);
    const previouslyAccumulated = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
    const currentSegment = Math.floor((Date.now() - startTime) / 1000);
    const newTotal = previouslyAccumulated + currentSegment;

    // Update Storage
    localStorage.setItem(TIMER_KEYS.STATUS, 'PAUSED');
    localStorage.setItem(TIMER_KEYS.ACCUMULATED, newTotal.toString());
    localStorage.removeItem(TIMER_KEYS.START_TIME); // Clear start time as we are not running

    setSeconds(newTotal);
    setTimerStatus('PAUSED');
  };

  const handleFinish = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Final calculation
    let finalSeconds = seconds;
    if (timerStatus === 'RUNNING') {
        const startTime = parseInt(localStorage.getItem(TIMER_KEYS.START_TIME) || Date.now().toString(), 10);
        const previouslyAccumulated = parseInt(localStorage.getItem(TIMER_KEYS.ACCUMULATED) || '0', 10);
        finalSeconds = previouslyAccumulated + Math.floor((Date.now() - startTime) / 1000);
    }

    if (finalSeconds < 60) {
      alert("记录时间太短 (少于1分钟)，建议继续工作或取消。");
      // If they cancel the finish, we just leave it as is (if running, it keeps running; if paused, stays paused)
      return; 
    }

    // Save Record
    const hours = parseFloat((finalSeconds / 3600).toFixed(2));
    const newRecord: WorkExpenseRecord = {
      id: Date.now().toString(),
      type: RecordType.WORK,
      value: hours,
      category,
      date: new Date().toISOString(),
      note: note || '计时会话'
    };
    StorageService.saveRecord(newRecord);
    setRecords(prev => [...prev, newRecord]);

    // Reset Timer & Storage
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

  // --- 4. Input Persistence ---
  // Save inputs as user types so refresh doesn't lose them
  const updateCategory = (val: string) => {
      setCategory(val);
      localStorage.setItem(TIMER_KEYS.CATEGORY, val);
  };

  const updateNote = (val: string) => {
      setNote(val);
      localStorage.setItem(TIMER_KEYS.NOTE, val);
  };

  // --- Formatting & Helpers ---
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Helper to get the "Shifted Date" (Virtual Day) for any ISO string.
   * Logic: If time < 6:00 AM, it counts as previous day.
   */
  const getShiftedDateStr = (dateString: string) => {
    const d = new Date(dateString);
    d.setHours(d.getHours() - 6); 
    return d.toISOString().split('T')[0];
  };

  // --- Date Navigation Logic ---
  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  
  const isTodaySelected = selectedDate === getTodayShifted();

  // --- Stats Calculation based on SELECTED DATE ---
  const workRecords = records.filter(r => r.type === RecordType.WORK);
  
  // 1. Selected Day Total
  const selectedDayTotal = workRecords
    .filter(r => getShiftedDateStr(r.date) === selectedDate)
    .reduce((a, b) => a + b.value, 0);

  // 2. Selected Day's Log List
  const selectedDayLogs = workRecords
    .filter(r => getShiftedDateStr(r.date) === selectedDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 3. Week Calculation
  const getStatsForPeriod = (startStr: string, endStr: string) => { 
     const filtered = workRecords.filter(r => {
        const d = getShiftedDateStr(r.date);
        return d >= startStr && d <= endStr;
     });
     const total = filtered.reduce((a, b) => a + b.value, 0);
     const uniqueDays = new Set(filtered.map(r => getShiftedDateStr(r.date))).size;
     return { total, avg: uniqueDays > 0 ? total / uniqueDays : 0 };
  };

  const selectedDateObj = new Date(selectedDate);
  const weekStart = new Date(selectedDateObj);
  weekStart.setDate(weekStart.getDate() - 6);
  const statsCurrentWeek = getStatsForPeriod(weekStart.toISOString().split('T')[0], selectedDate);

  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  const statsPrevWeek = getStatsForPeriod(prevWeekStart.toISOString().split('T')[0], prevWeekEnd.toISOString().split('T')[0]);

  const monthStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
  const monthEnd = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0);
  const statsMonth = getStatsForPeriod(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);

  const yearStart = new Date(selectedDateObj.getFullYear(), 0, 1);
  const yearEnd = new Date(selectedDateObj.getFullYear(), 11, 31);
  const statsYear = getStatsForPeriod(yearStart.toISOString().split('T')[0], yearEnd.toISOString().split('T')[0]);

  const weekDiff = statsCurrentWeek.total - statsPrevWeek.total;
  const weekDiffPercent = statsPrevWeek.total > 0 ? (weekDiff / statsPrevWeek.total) * 100 : 0;

  // Chart Data
  const chartData = Array.from({length: 7}, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (6 - i));
    const labelDate = d.toISOString().split('T')[0]; 
    const dailyTotal = workRecords
      .filter(r => getShiftedDateStr(r.date) === labelDate)
      .reduce((acc, curr) => acc + curr.value, 0);
    return { date: labelDate.slice(5), hours: dailyTotal };
  });

  const StatBox = ({ label, total, avg }: { label: string, total: number, avg: number }) => (
      <div className="bg-[#F5F5F7] p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
          <div className="mt-2">
             <div className="flex justify-between items-end">
                 <span className="text-xl font-bold text-gray-800">{total.toFixed(1)}h</span>
                 <span className="text-xs text-gray-500 mb-1">总计</span>
             </div>
             <div className="flex justify-between items-end mt-1">
                 <span className="text-sm font-semibold text-[#8E5E73]">{avg.toFixed(1)}h</span>
                 <span className="text-xs text-gray-400">平均/天</span>
             </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">工作计时</h2>
              <div className="group relative">
                  <Info size={18} className="text-white/50 cursor-help" />
                  <div className="absolute left-full top-0 ml-2 w-64 p-3 bg-black/90 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-light">
                      工业级计时内核：即使关闭浏览器或刷新页面，计时也会在后台准确运行。依据 6AM 法则归档。
                  </div>
              </div>
          </div>
          <p className="text-white/70 mt-1">记录专注时刻，累积心流体验。</p>
        </div>
        
        {/* Date Navigation */}
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
        {/* Timer Card */}
        <div className={`bg-white p-8 rounded-3xl shadow-lg border border-white/20 flex flex-col items-center justify-center min-h-[300px] transition-all relative overflow-hidden ${!isTodaySelected ? 'opacity-90 grayscale-[0.5]' : ''}`}>
          
          {/* Active Status Indicator */}
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
                  <button onClick={() => setSelectedDate(getTodayShifted())} className="mt-2 text-sm underline text-gray-500 hover:text-gray-800">回到今天进行计时</button>
              </div>
          )}

          <div className="text-xs font-medium text-[#8E5E73] mb-2 bg-[#8E5E73]/10 px-3 py-1 rounded-full">
            {selectedDate} 已工作: {selectedDayTotal.toFixed(2)} 小时
          </div>
          
          <div className="text-7xl font-mono font-light tracking-tighter text-gray-900 mb-8 tabular-nums relative">
            {isTodaySelected ? formatTime(seconds) : formatTime(0)}
            {timerStatus === 'PAUSED' && isTodaySelected && <span className="absolute -right-6 top-0 text-xs text-orange-400 font-bold uppercase">Paused</span>}
          </div>
          
          <div className="w-full space-y-4 mb-8">
             <select 
               value={category} 
               onChange={(e) => updateCategory(e.target.value)}
               className="w-full bg-[#F5F5F7] p-3 rounded-xl text-center outline-none text-gray-700 focus:ring-2 focus:ring-[#8E5E73]/20 transition-all"
               disabled={!isTodaySelected}
             >
                <option value="Deep Work">深度工作 (Deep Work)</option>
                <option value="Meeting">会议 (Meeting)</option>
                <option value="Learning">学习 (Learning)</option>
                <option value="Creation">创作 (Creation)</option>
             </select>
             <input 
               type="text" 
               placeholder="备注 (可选)..."
               value={note}
               onChange={(e) => updateNote(e.target.value)}
               className="w-full bg-transparent border-b border-gray-200 p-2 text-center outline-none focus:border-[#8E5E73] transition-colors text-gray-800"
               disabled={!isTodaySelected}
             />
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

        {/* Stats Column */}
        <div className="flex flex-col gap-6">
           {/* Week Comparison Card */}
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

           {/* Chart */}
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
          
          {/* Detailed Stats Grid */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20 flex-1">
             <div className="grid grid-cols-2 gap-4 h-full">
                <StatBox label={`${selectedDate.slice(5,7)}月总计`} total={statsMonth.total} avg={statsMonth.avg} />
                <StatBox label={`${selectedDate.slice(0,4)}年总计`} total={statsYear.total} avg={statsYear.avg} />
             </div>
          </div>
        </div>
      </div>

      {/* Daily Logs List */}
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
