
import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">今日计划与复盘</h2>
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
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 min-h-[400px]">
            <form onSubmit={addTask} className="flex gap-4 mb-8">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="今天最重要的事是..."
                className="flex-1 bg-[#F5F5F7] border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#8E5E73]/20 outline-none transition-all placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#8E5E73] text-white p-3 rounded-xl hover:bg-[#7a4f61] transition-colors shadow-md">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-3">
              {plan.tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => toggleTask(task.id)}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-[#8E5E73] border-[#8E5E73]' : 'border-gray-300 group-hover:border-[#8E5E73]/50'}`}>
                    {task.completed && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className={`text-lg transition-all ${task.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}>
                    {task.text}
                  </span>
                </div>
              ))}
              {plan.tasks.length === 0 && (
                <div className="text-center text-gray-400 py-12">空空如也。请开始规划你的一天。</div>
              )}
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">执行力概览</h4>
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
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-6 text-[#8E5E73]">晚间复盘</h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">今日收获</label>
                <textarea 
                  className="w-full bg-[#F5F5F7] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#8E5E73]/20 outline-none resize-none h-32 text-sm text-gray-800"
                  placeholder="今天学到了什么？创造了什么价值？"
                  value={plan.harvest}
                  onChange={(e) => save({...plan, harvest: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">自我反思</label>
                <textarea 
                  className="w-full bg-[#F5F5F7] rounded-xl p-4 border-none focus:ring-2 focus:ring-[#8E5E73]/20 outline-none resize-none h-32 text-sm text-gray-800"
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
