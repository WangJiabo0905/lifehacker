
import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Repeat, Check, CalendarDays, Trash2, AlertTriangle, Eraser, Loader, Layers } from 'lucide-react';
import { DailyPlan } from '../types';
import { StorageService } from '../services/storageService';

// Moved outside to prevent re-creation on every render
// Fixed: Explicit type for setType (was any)
const OptionBtn = ({ type, label, days, currentType, setType }: { type: string, label: string, days?: string, currentType: string, setType: (t: string) => void }) => (
  <button
    onClick={() => setType(type)}
    className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
        currentType === type 
        ? 'bg-[#8E5E73] text-white border-[#8E5E73] shadow-md transform scale-105' 
        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
      <span>{label}</span>
      {days && <span className={`text-[10px] ${currentType === type ? 'text-white/70' : 'text-gray-300'}`}>{days}</span>}
  </button>
);

export const DailyPlanPage: React.FC = () => {
  // Use local time for "today" instead of UTC to avoid date shift bugs in early mornings
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const [currentDate, setCurrentDate] = useState(today);
  const [plan, setPlan] = useState<DailyPlan>({ date: today, tasks: [], review: '', harvest: '' });
  const [newTask, setNewTask] = useState('');

  // --- Batch Plan Modal State ---
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTask, setBatchTask] = useState('');
  const [batchType, setBatchType] = useState<'SINGLE' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('SINGLE');
  const [batchStartDate, setBatchStartDate] = useState(today);
  const [batchEndDate, setBatchEndDate] = useState(today);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // --- Batch Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [foundTasks, setFoundTasks] = useState<{text: string, count: number}[]>([]);
  const [selectedDeleteTasks, setSelectedDeleteTasks] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const existing = await StorageService.getPlan(currentDate);
        if (existing) {
            setPlan(existing);
        } else {
            setPlan({ date: currentDate, tasks: [], review: '', harvest: '' });
        }
    };
    loadData();
  }, [currentDate]);

  // Sync batch start date with current view date when modal opens
  useEffect(() => {
      if (isBatchModalOpen) {
          setBatchStartDate(currentDate);
          setBatchEndDate(currentDate); 
      }
      if (isDeleteModalOpen) {
          setSelectedDeleteTasks(new Set());
          scanTasks();
      }
  }, [isBatchModalOpen, isDeleteModalOpen, currentDate]);

  const scanTasks = async () => {
      setIsScanning(true);
      try {
          // Scan FUTURE tasks (including today)
          const stats = await StorageService.getFutureTaskStats(today);
          setFoundTasks(stats);
      } finally {
          setIsScanning(false);
      }
  };

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

  const removeTask = async (e: React.MouseEvent, id: string) => {
      // IMPORTANT: Stop propagation to prevent triggering toggleTask on parent div
      e.stopPropagation();
      e.preventDefault();
      
      const updated = {
          ...plan,
          tasks: plan.tasks.filter(t => t.id !== id)
      };
      await save(updated);
  };

  // --- Batch Add Algorithm ---
  const handleBatchSave = async () => {
      if (!batchTask.trim()) return;
      setIsSavingBatch(true);

      try {
          const start = new Date(batchStartDate + 'T00:00:00');
          let end = new Date(batchStartDate + 'T00:00:00');

          if (batchType === 'WEEK') end.setDate(start.getDate() + 6);
          else if (batchType === 'MONTH') end.setDate(start.getDate() + 29);
          else if (batchType === 'YEAR') end.setDate(start.getDate() + 364);
          else if (batchType === 'CUSTOM') end = new Date(batchEndDate + 'T00:00:00');

          if (end < start) {
              alert("结束日期不能早于开始日期");
              setIsSavingBatch(false);
              return;
          }

          const plansToSave: DailyPlan[] = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              plansToSave.push({
                  date: dateStr,
                  tasks: [{ id: Date.now() + Math.random().toString(), text: batchTask, completed: false }],
                  review: '',
                  harvest: ''
              });
          }

          await StorageService.savePlansBulk(plansToSave);

          const reloaded = await StorageService.getPlan(currentDate);
          if (reloaded) setPlan(reloaded);
          
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

  // --- Batch Delete Algorithm ---
  const toggleDeleteSelection = (text: string) => {
      const newSet = new Set(selectedDeleteTasks);
      if (newSet.has(text)) {
          newSet.delete(text);
      } else {
          newSet.add(text);
      }
      setSelectedDeleteTasks(newSet);
  };

  const handleBatchDelete = async () => {
      if (selectedDeleteTasks.size === 0) return;
      
      setIsDeletingBatch(true);
      try {
          // Delete only Future (Today+)
          await StorageService.deleteTasksFromDate(Array.from(selectedDeleteTasks), today);

          // Refresh UI
          const reloaded = await StorageService.getPlan(currentDate);
          if (reloaded) setPlan(reloaded);
          
          setIsDeleteModalOpen(false);
          setSelectedDeleteTasks(new Set());
      } catch (e) {
          console.error(e);
          alert("删除失败");
      } finally {
          setIsDeletingBatch(false);
      }
  };

  const changeDay = (offset: number) => {
      const d = new Date(currentDate + 'T00:00:00'); 
      d.setDate(d.getDate() + offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setCurrentDate(`${year}-${month}-${day}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      
      {/* Batch Plan Modal (ADD) */}
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
                <CalendarDays size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">快速批量规划</h3>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar p-1">
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

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">持续时间 / 频率</label>
                    <div className="flex gap-2 mb-2">
                        <OptionBtn type="SINGLE" label="仅一次" days="Selected Day" currentType={batchType} setType={setBatchType as any} />
                        <OptionBtn type="WEEK" label="未来一周" days="7 Days" currentType={batchType} setType={setBatchType as any} />
                        <OptionBtn type="MONTH" label="未来一月" days="30 Days" currentType={batchType} setType={setBatchType as any} />
                    </div>
                    <div className="flex gap-2">
                         <OptionBtn type="YEAR" label="全年" days="365 Days" currentType={batchType} setType={setBatchType as any} />
                         <OptionBtn type="CUSTOM" label="自定义" days="Range" currentType={batchType} setType={setBatchType as any} />
                    </div>
                </div>

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

      {/* Batch Delete Modal (Global Scan) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh] border-2 border-red-50">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-2.5 rounded-xl text-red-500 shadow-sm border border-red-100">
                <Trash2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">批量移除任务</h3>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl mb-4 flex gap-3 border border-orange-100">
                <AlertTriangle className="text-orange-500 flex-shrink-0" size={20}/>
                <div className="space-y-1">
                   <p className="text-xs text-orange-800 font-bold">
                       仅影响【今天及未来】的计划
                   </p>
                   <p className="text-xs text-orange-700 leading-relaxed">
                       系统已扫描未来的任务。删除后，<strong className="underline">过去的打卡记录将被完整保留</strong>，只有今天和未来的计划会被清除。
                   </p>
                </div>
            </div>
            
            {/* Task List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 min-h-[300px] mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Layers size={12}/>
                        待执行的任务 ({foundTasks.length})
                    </span>
                    {selectedDeleteTasks.size > 0 && <span className="text-xs text-red-500 font-bold">已选 {selectedDeleteTasks.size} 类</span>}
                </div>

                {isScanning ? (
                    <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                        <Loader className="animate-spin" size={20}/>
                        <span>正在扫描未来计划...</span>
                    </div>
                ) : foundTasks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        今天及未来暂无任何计划。
                    </div>
                ) : (
                    <div className="space-y-2">
                        {foundTasks.map((item) => {
                            const isSelected = selectedDeleteTasks.has(item.text);
                            return (
                                <div 
                                    key={item.text}
                                    onClick={() => toggleDeleteSelection(item.text)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${isSelected ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <Check size={12} className="text-white"/>}
                                        </div>
                                        <span className={`truncate font-medium transition-colors ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>{item.text}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-medium ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                        剩余 {item.count} 次
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button
                onClick={handleBatchDelete}
                disabled={selectedDeleteTasks.size === 0 || isDeletingBatch}
                className="w-full bg-red-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                {isDeletingBatch ? <Repeat className="animate-spin" size={18}/> : <Trash2 size={18} />}
                {isDeletingBatch ? "清理 (保留历史)" : `删除选中计划 (保留历史)`}
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-bold text-white">今日计划与复盘</h2>
             <div className="flex gap-2">
                 <button 
                onClick={() => setIsBatchModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors backdrop-blur-md border border-white/5 group flex items-center gap-2 px-3"
                title="批量添加计划"
                >
                <CalendarDays size={18} className="text-yellow-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white/80 hidden md:inline">批量/周期规划</span>
                </button>
                <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-white/10 hover:bg-red-500/20 text-white p-2 rounded-xl transition-colors backdrop-blur-md border border-white/5 group flex items-center gap-2 px-3"
                title="批量清理计划"
                >
                <Eraser size={18} className="text-red-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white/80 hidden md:inline">批量移除</span>
                </button>
             </div>
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
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-white/20 p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#8E5E73] rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-800">今日待办</h3>
                </div>
                 <div className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    {plan.tasks.filter(t => t.completed).length} / {plan.tasks.length} 完成
                </div>
            </div>

            <form onSubmit={addTask} className="flex gap-4 mb-6">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="今天最重要的事是..."
                className="flex-1 bg-[#F5F5F7] border-none rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#8E5E73]/20 outline-none transition-all placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#8E5E73] text-white p-4 rounded-2xl hover:bg-[#7a4f61] transition-colors shadow-md flex-shrink-0">
                <Plus size={24} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-3">
                  {plan.tasks.map(task => (
                    <div key={task.id} className="group flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                      {/* Checkbox Area - Clickable */}
                      <div 
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer flex-shrink-0 ${task.completed ? 'bg-[#8E5E73] border-[#8E5E73] scale-110' : 'border-gray-300 group-hover:border-[#8E5E73]/50'}`}
                      >
                        {task.completed && <CheckCircle size={14} className="text-white" />}
                      </div>
                      
                      {/* Text Area - Clickable */}
                      <span 
                        onClick={() => toggleTask(task.id)}
                        className={`text-lg transition-all flex-1 cursor-pointer break-all ${task.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}
                      >
                        {task.text}
                      </span>
                      
                      {/* Single Delete Button */}
                      <button 
                        type="button"
                        onClick={(e) => removeTask(e, task.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all relative z-10 cursor-pointer opacity-0 group-hover:opacity-100"
                        title="删除"
                      >
                          <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                {plan.tasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 min-h-[200px]">
                        <Repeat className="mb-4 opacity-30" size={48}/>
                        <span>空空如也。请开始规划你的一天。</span>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Review */}
        <div className="bg-white rounded-3xl shadow-lg border border-white/20 p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-[#8E5E73] rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">晚间复盘</h3>
            </div>
            
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#F5F5F7] rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-[#8E5E73]/10 flex-1 flex flex-col group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide group-focus-within:text-[#8E5E73] transition-colors">今日收获</label>
                <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none flex-1 text-sm text-gray-800 leading-relaxed placeholder:text-gray-300"
                  placeholder="今天学到了什么？创造了什么价值？"
                  value={plan.harvest}
                  onChange={(e) => save({...plan, harvest: e.target.value})}
                />
              </div>
              
              <div className="bg-[#F5F5F7] rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-[#8E5E73]/10 flex-1 flex flex-col group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide group-focus-within:text-[#8E5E73] transition-colors">自我反思</label>
                <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none flex-1 text-sm text-gray-800 leading-relaxed placeholder:text-gray-300"
                  placeholder="哪些做得好？哪些需要改进？"
                  value={plan.review}
                  onChange={(e) => save({...plan, review: e.target.value})}
                />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
