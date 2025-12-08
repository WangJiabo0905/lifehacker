import React, { useEffect, useState, useRef } from 'react';
import { RecordType, WorkExpenseRecord } from '../types';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Square, Save, Clock, CalendarRange, TrendingUp, TrendingDown, Minus, Info, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const WorkTimerPage: React.FC = () => {
  const [records, setRecords] = useState<WorkExpenseRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
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
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRecords(StorageService.getRecords());
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const toggleTimer = () => {
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    setIsRunning(!isRunning);
  };

  const saveSession = () => {
    if (seconds < 60) {
      alert("记录时间太短 (少于1分钟)");
      return;
    }
    const hours = parseFloat((seconds / 3600).toFixed(2));
    const now = new Date();
    // Save with actual time
    const newRecord: WorkExpenseRecord = {
      id: Date.now().toString(),
      type: RecordType.WORK,
      value: hours,
      category,
      date: now.toISOString(),
      note: note || '计时会话'
    };
    StorageService.saveRecord(newRecord);
    setRecords(prev => [...prev, newRecord]);
    setSeconds(0);
    setNote('');
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

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

  // 3. Week Calculation (Week ending on Selected Date)
  const getStatsForPeriod = (startStr: string, endStr: string) => { // endStr is inclusive
     const filtered = workRecords.filter(r => {
        const d = getShiftedDateStr(r.date);
        return d >= startStr && d <= endStr;
     });
     const total = filtered.reduce((a, b) => a + b.value, 0);
     const uniqueDays = new Set(filtered.map(r => getShiftedDateStr(r.date))).size;
     return { total, avg: uniqueDays > 0 ? total / uniqueDays : 0 };
  };

  const selectedDateObj = new Date(selectedDate);
  
  // Current Week (Selected Date - 6 days to Selected Date)
  const weekStart = new Date(selectedDateObj);
  weekStart.setDate(weekStart.getDate() - 6);
  const statsCurrentWeek = getStatsForPeriod(weekStart.toISOString().split('T')[0], selectedDate);

  // Previous Week (Current Week Start - 7 days)
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  const statsPrevWeek = getStatsForPeriod(prevWeekStart.toISOString().split('T')[0], prevWeekEnd.toISOString().split('T')[0]);

  // Month (Month of Selected Date)
  const monthStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
  const monthEnd = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0);
  const statsMonth = getStatsForPeriod(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);

  // Year (Year of Selected Date)
  const yearStart = new Date(selectedDateObj.getFullYear(), 0, 1);
  const yearEnd = new Date(selectedDateObj.getFullYear(), 11, 31);
  const statsYear = getStatsForPeriod(yearStart.toISOString().split('T')[0], yearEnd.toISOString().split('T')[0]);

  // Comparison Logic
  const weekDiff = statsCurrentWeek.total - statsPrevWeek.total;
  const weekDiffPercent = statsPrevWeek.total > 0 ? (weekDiff / statsPrevWeek.total) * 100 : 0;

  // Chart Data: Last 7 days ending on SELECTED DATE
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
                      依据“生活黑客”法则，每日更新时间为早晨 6:00。凌晨的奋斗将计入前一日。
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
        {/* Timer Card - Only Active if Today is Selected */}
        <div className={`bg-white p-8 rounded-3xl shadow-lg border border-white/20 flex flex-col items-center justify-center min-h-[300px] transition-all ${!isTodaySelected ? 'opacity-90 grayscale-[0.5]' : ''}`}>
          
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
          <div className="text-7xl font-mono font-light tracking-tighter text-gray-900 mb-8">
            {isTodaySelected ? formatTime(seconds) : formatTime(0)}
          </div>
          
          <div className="w-full space-y-4 mb-8">
             <select 
               value={category} 
               onChange={(e) => setCategory(e.target.value)}
               className="w-full bg-[#F5F5F7] p-3 rounded-xl text-center outline-none text-gray-700"
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
               onChange={(e) => setNote(e.target.value)}
               className="w-full bg-transparent border-b border-gray-200 p-2 text-center outline-none focus:border-[#8E5E73] transition-colors text-gray-800"
               disabled={!isTodaySelected}
             />
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={toggleTimer}
              disabled={!isTodaySelected}
              className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-orange-50 text-orange-600' : 'bg-[#8E5E73] text-white hover:bg-[#7a4f61]'}`}
            >
              {isRunning ? <><Square size={18} fill="currentColor"/> 暂停</> : <><Play size={18} fill="currentColor"/> 开始</>}
            </button>
            {(seconds > 0 || isRunning) && (
              <button 
                onClick={saveSession}
                className="flex-1 bg-green-50 text-green-700 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
              >
                <Save size={18} /> 完成
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
                   <Clock size={20} className="text-[#8E5E73]" /> 周期对比 (7天)
                 </h3>
                 <div className={`flex items-center gap-1 text-sm font-bold ${weekDiff >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {weekDiff >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    {Math.abs(weekDiff).toFixed(1)}h ({Math.abs(weekDiffPercent).toFixed(0)}%)
                 </div>
              </div>
              <div className="flex gap-4 items-end justify-around text-center">
                 <div>
                    <div className="text-2xl font-bold text-gray-800">{statsCurrentWeek.total.toFixed(1)}h</div>
                    <div className="text-xs text-gray-400">{selectedDate.slice(5)} 这一周</div>
                 </div>
                 <div className="text-gray-300 mb-2"><Minus /></div>
                 <div>
                    <div className="text-2xl font-bold text-gray-400">{statsPrevWeek.total.toFixed(1)}h</div>
                    <div className="text-xs text-gray-400">上一周</div>
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