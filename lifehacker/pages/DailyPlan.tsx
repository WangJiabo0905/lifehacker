
import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, CalendarRange, Repeat, Check } from 'lucide-react';
import { DailyPlan } from '../types';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DailyPlanPage: React.FC = () => {
  // Use local time for "today" instead of UTC to avoid date shift bugs in early mornings
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const [currentDate, setCurrentDate] = useState(today);
  const [plan, setPlan] = useState<DailyPlan>({ date: today, tasks: [], review: '', harvest: '' });
  const [newTask, setNewTask] = useState('');
  const [history, setHistory] = useState<DailyPlan[]>([]);

  // --- Batch Plan Modal State ---
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTask, setBatchTask] = useState('');
  const [batchType, setBatchType] = useState<'SINGLE' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('SINGLE');
  const [batchStartDate, setBatchStartDate] = useState(today);
  const [batchEndDate, setBatchEndDate] = useState(today);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const existing = await StorageService.getPlan(currentDate);
        if (existing) {
            setPlan(existing);
        } else {
            setPlan({ date: currentDate, tasks: [], review: '', harvest: '' });
        }

        const allPlans = await StorageService.getAllPlans();
        setHistory(Object.values(allPlans).sort((a,b) => a.date.localeCompare(b.date)));
    };
    loadData();
  }, [currentDate]);

  // Sync batch start date with current view date when modal opens
  useEffect(() => {
      if (isBatchModalOpen) {
          setBatchStartDate(currentDate);
          setBatchEndDate(currentDate); // Reset end date default
      }
  }, [isBatchModalOpen, currentDate]);

  const save = async (updated: DailyPlan) => {
    setPlan(updated);
    await StorageService.savePlan(updated);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const updated = {
      ...plan,
      tasks: [...plan.tasks, { id: Date.now().toString(), text: newTask, completed: false }]
    };
    await save(updated);
    setNewTask('');
  };

  const toggleTask = async (id: string) => {
    const updated = {
      ...plan,
      tasks: plan.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    };
    await save(updated);
  };

  // --- Batch Algorithm ---
  const handleBatchSave = async () => {
      if (!batchTask.trim()) return;
      setIsSavingBatch(true);

      try {
          // Calculate Date Range
          const start = new Date(batchStartDate + 'T00:00:00');
          let end = new Date(batchStartDate + 'T00:00:00');

          if (batchType === 'WEEK') {
              end.setDate(start.getDate() + 6);
          } else if (batchType === 'MONTH') {
              end.setDate(start.getDate() + 29);
          } else if (batchType === 'YEAR') {
              end.setDate(start.getDate() + 364);
          } else if (batchType === 'CUSTOM') {
              end = new Date(batchEndDate + 'T00:00:00');
          }
          // 'SINGLE' means start == end, which is default

          if (end < start) {
              alert("结束日期不能早于开始日期");
              setIsSavingBatch(false);
              return;
          }

          const plansToSave: DailyPlan[] = [];
          
          // Loop through dates
          // Clone start date iterator to avoid modifying original start date reference if needed later
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;

              plansToSave.push({
                  date: dateStr,
                  tasks: [{ id: Date.now() + Math.random().toString(), text: batchTask, completed: false }],
                  review: '',
                  harvest: ''
              });
          }

          // Bulk Save (StorageService handles merging)
          await StorageService.savePlansBulk(plansToSave);

          // Refresh current day view if affected
          const currentAffected = plansToSave.find(p => p.date === currentDate);
          if (currentAffected) {
               const reloaded = await StorageService.getPlan(currentDate);
               if (reloaded) setPlan(reloaded);
          }
          
          // Refresh charts
          const allPlans = await StorageService.getAllPlans();
          setHistory(Object.values(allPlans).sort((a,b) => a.date.localeCompare(b.date)));

          // Close and Reset
          setIsBatchModalOpen(false);
          setBatchTask('');
          setBatchType('SINGLE');

      } catch (error) {
          console.error(error);
          alert("保存失败");
      } finally {
          setIsSavingBatch(false);
      }
  };

  // Chart Data: Last 7 days relative to TODAY
  const chartData = history.slice(-7).map(p => ({
    date: p.date.slice(5),
    completed: p.tasks.filter(t => t.completed).length,
    total: p.tasks.length
  }));

  const changeDay = (offset: number) => {
      const d = new Date(currentDate + 'T00:00:00'); // Force local time
      d.setDate(d.getDate() + offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setCurrentDate(`${year}-${month}-${day}`);
  };

  const OptionBtn = ({ type, label, days }: { type: typeof batchType, label: string, days?: string }) => (
      <button
        onClick={() => setBatchType(type)}
        className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
            batchType === type 
            ? 'bg-[#8E5E73] text-white border-[#8E5E73] shadow-md transform scale-105' 
            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
          <span>{label}</span>
          {days && <span className={`text-[10px] ${batchType === type ? 'text-white/70' : 'text-gray-300'}`}>{days}</span>}
      </button>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      
      {/* Batch Plan Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setIsBatchModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#8E5E73] to-[#b37a92] p-2.5 rounded-xl text-white shadow-lg">
                <CalendarRange size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">快速批量规划</h3>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar p-1">
                {/* Input Task */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">计划内容</label>
                    <textarea
                        className="w-full bg-[#F5F5F7] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#8E5E73]/20 outline-none resize-none text-gray-800 transition-all text-sm min-h-[100px]"
                        placeholder="例如：背30个单词、晨跑5公里..."
                        value={batchTask}
                        onChange={(e) => setBatchTask(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Duration Select */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">持续时间 / 频率</label>
                    <div className="flex gap-2 mb-2">
                        <OptionBtn type="SINGLE" label="仅一次" days="Selected Day" />
                        <OptionBtn type="WEEK" label="未来一周" days="7 Days" />
                        <OptionBtn type="MONTH" label="未来一月" days="30 Days" />
                    </div>
                    <div className="flex gap-2">
                         <OptionBtn type="YEAR" label="全年" days="365 Days" />
                         <OptionBtn type="CUSTOM" label="自定义" days="Range" />
                    </div>
                </div>

                {/* Date Pickers */}
                <div className="bg-[#F5F5F7] rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">开始日期</label>
                        <input 
                            type="date" 
                            value={batchStartDate}
                            onChange={(e) => setBatchStartDate(e.target.value)}
                            className="w-full bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none border border-gray-200 focus:border-[#8E5E73]"
                        />
                    </div>
                    
                    {batchType === 'CUSTOM' && (
                        <>
                            <div className="text-gray-400 mt-4"><ChevronRight size={16}/></div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">结束日期</label>
                                <input 
                                    type="date" 
                                    value={batchEndDate}
                                    onChange={(e) => setBatchEndDate(e.target.value)}
                                    className="w-full bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none border border-gray-200 focus:border-[#8E5E73]"
                                />
                            </div>
                        </>
                    )}
                    {batchType !== 'CUSTOM' && batchType !== 'SINGLE' && (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 mt-4">
                            自动计算结束日期
                        </div>
                    )}
                </div>

                <button
                    onClick={handleBatchSave}
                    disabled={!batchTask.trim() || isSavingBatch}
                    className="w-full bg-[#8E5E73] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#7a4f61] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {isSavingBatch ? <Repeat className="animate-spin" size={18}/> : <Check size={18} />}
                    {isSavingBatch ? "正在生成..." : "确认添加计划"}
                </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-bold text-white">今日计划与复盘</h2>
             <button 
               onClick={() => setIsBatchModalOpen(true)}
               className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors backdrop-blur-md border border-white/5 group flex items-center gap-2 px-3"
               title="批量添加计划"
             >
               <CalendarRange size={18} className="text-yellow-200 group-hover:scale-110 transition-transform" />
               <span className="text-xs font-medium text-white/80 hidden md:inline">批量/周期规划</span>
             </button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-white/90">
             <button onClick={() => changeDay(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={16}/></button>
             <div className="relative group flex items-center gap-2">
               <CalendarIcon size={14} className="opacity-70"/>
               {/* Date Picker Input */}
               <input 
                 type="date" 
                 value={currentDate} 
                 onChange={(e) => setCurrentDate(e.target.value)} 
                 className="bg-transparent border-none text-white font-medium outline-none focus:ring-0 cursor-pointer text-base"
               />
               <span className="text-sm opacity-60 font-light">
                 {currentDate === today ? '(今天)' : ''}
               </span>
             </div>
             <button onClick={() => changeDay(1)} disabled={currentDate === today} className={`p-1 rounded-full transition-colors ${currentDate === today ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}><ChevronRight size={16}/></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-white/20 p-6 min-h-[400px]">
            <form onSubmit={addTask} className="flex gap-4 mb-8">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="今天最重要的事是..."
                className="flex-1 bg-[#F5F5F7] border-none rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#8E5E73]/20 outline-none transition-all placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#8E5E73] text-white p-4 rounded-2xl hover:bg-[#7a4f61] transition-colors shadow-md">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3">
              {plan.tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-gray-100" onClick={() => toggleTask(task.id)}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-[#8E5E73] border-[#8E5E73] scale-110' : 'border-gray-300 group-hover:border-[#8E5E73]/50'}`}>
                    {task.completed && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className={`text-lg transition-all ${task.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}>
                    {task.text}
                  </span>
                </div>
              ))}
              {plan.tasks.length === 0 && (
                <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <Repeat className="mb-4 opacity-20" size={40}/>
                    <span>空空如也。请开始规划你的一天。</span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white rounded-3xl shadow-lg border border-white/20 p-6">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 pl-2">执行力概览</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="completed" fill="#8E5E73" radius={[4, 4, 0, 0]} barSize={20} name="已完成" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Review */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-white/20 p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-[#8E5E73] rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">晚间复盘</h3>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="bg-[#F5F5F7] rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-[#8E5E73]/10">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">今日收获</label>
                <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none h-32 text-sm text-gray-800 leading-relaxed placeholder:text-gray-300"
                  placeholder="今天学到了什么？创造了什么价值？"
                  value={plan.harvest}
                  onChange={(e) => save({...plan, harvest: e.target.value})}
                />
              </div>
              
              <div className="bg-[#F5F5F7] rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-[#8E5E73]/10">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">自我反思</label>
                <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none h-32 text-sm text-gray-800 leading-relaxed placeholder:text-gray-300"
                  placeholder="哪些做得好？哪些需要改进？"
                  value={plan.review}
                  onChange={(e) => save({...plan, review: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
