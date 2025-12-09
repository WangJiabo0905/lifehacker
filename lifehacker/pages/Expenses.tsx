
import React, { useEffect, useState } from 'react';
import { RecordType, WorkExpenseRecord } from '../types';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, Plus, TrendingUp, Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [records, setRecords] = useState<WorkExpenseRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    StorageService.getRecords().then(setRecords);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    let dateToSave = new Date().toISOString();
    if (selectedDate !== today) {
        dateToSave = new Date(selectedDate + 'T12:00:00').toISOString();
    }

    const newRecord: WorkExpenseRecord = {
      id: Date.now().toString(),
      type: RecordType.EXPENSE,
      value: parseFloat(amount),
      category,
      date: dateToSave,
      note
    };

    await StorageService.saveRecord(newRecord);
    setRecords(prev => [...prev, newRecord]);
    setAmount('');
    setNote('');
  };

  const handleDelete = async (id: string) => {
    await StorageService.deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const expenseRecords = records.filter(r => r.type === RecordType.EXPENSE);

  const selectedDateObj = new Date(selectedDate);

  const getStats = (period: 'day' | 'week' | 'month' | 'year') => {
      let filtered = [];
      
      if (period === 'day') {
          filtered = expenseRecords.filter(r => r.date.startsWith(selectedDate));
      } else if (period === 'week') {
          const start = new Date(selectedDateObj);
          start.setDate(start.getDate() - 6);
          const startStr = start.toISOString().split('T')[0];
          filtered = expenseRecords.filter(r => {
              const d = r.date.split('T')[0];
              return d >= startStr && d <= selectedDate;
          });
      } else if (period === 'month') {
          const m = selectedDate.slice(0, 7); 
          filtered = expenseRecords.filter(r => r.date.startsWith(m));
      } else {
          const y = selectedDate.slice(0, 4); 
          filtered = expenseRecords.filter(r => r.date.startsWith(y));
      }

      const total = filtered.reduce((a, b) => a + b.value, 0);
      const uniqueDays = period === 'day' ? 1 : new Set(filtered.map(r => r.date.split('T')[0])).size;
      const avg = uniqueDays > 0 ? total / uniqueDays : 0;

      return { total, avg, records: filtered };
  };

  const statsDay = getStats('day');
  const statsWeek = getStats('week');
  const statsMonth = getStats('month');
  const statsYear = getStats('year');

  const chartData = Array.from({length: 7}, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dailyTotal = expenseRecords
      .filter(r => r.date.startsWith(dateStr))
      .reduce((acc, curr) => acc + curr.value, 0);
    return { date: dateStr.slice(5), amount: dailyTotal };
  });

  const StatBox = ({ label, total, avg }: { label: string, total: number, avg: number }) => (
      <div className="bg-[#F5F5F7] p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
          <div className="mt-2">
             <div className="flex justify-between items-end">
                 <span className="text-xl font-bold text-gray-800">¥{total.toLocaleString()}</span>
                 <span className="text-xs text-gray-500 mb-1">总计</span>
             </div>
             <div className="flex justify-between items-end mt-1">
                 <span className="text-sm font-semibold text-[#8E5E73]">¥{avg.toFixed(0)}</span>
                 <span className="text-xs text-gray-400">平均/天</span>
             </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">日常开销</h2>
          <p className="text-white/70 mt-1">审视每一笔支出，控制欲望。</p>
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
             <button onClick={() => changeDate(1)} disabled={selectedDate === today} className={`p-1 text-white rounded-full transition-colors ${selectedDate === today ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}><ChevronRight size={20}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-white/20 relative overflow-hidden">
           {selectedDate !== today && (
               <div className="absolute top-0 left-0 right-0 bg-[#8E5E73] text-white text-xs text-center py-1">
                   补录模式: 正在为 {selectedDate} 记录
               </div>
           )}
           <form onSubmit={handleSubmit} className="space-y-6 mt-2">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">金额 (¥)</label>
               <input 
                 type="number" 
                 step="0.01"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 className="w-full text-5xl font-light border-b border-gray-200 py-4 outline-none focus:border-[#8E5E73] transition-colors bg-transparent placeholder-gray-200 mt-2 text-[#8E5E73]"
                 placeholder="0.00"
                 autoFocus
               />
             </div>
             
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 block">分类</label>
                <div className="flex gap-3">
                    {['Food', 'Transport', 'Shopping', 'Other'].map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${category === cat ? 'bg-[#8E5E73] text-white border-[#8E5E73]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {cat === 'Food' && '饮食'}
                            {cat === 'Transport' && '交通'}
                            {cat === 'Shopping' && '购物'}
                            {cat === 'Other' && '其他'}
                        </button>
                    ))}
                </div>
             </div>

             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">备注</label>
               <input 
                 type="text" 
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 className="w-full bg-[#F5F5F7] p-4 rounded-xl mt-2 border-none outline-none text-gray-800"
                 placeholder="买了什么..."
               />
             </div>

             <button type="submit" className="w-full bg-[#8E5E73] text-white py-4 rounded-xl font-medium hover:bg-[#7a4f61] transition-transform active:scale-95 flex items-center justify-center gap-2">
                <Plus size={18} />
                <span>{selectedDate === today ? '记一笔' : '补录一笔'}</span>
             </button>
           </form>
        </div>

        <div className="flex flex-col gap-6">
           <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20">
              <div className="flex items-center gap-2 mb-6">
                 <CreditCard size={20} className="text-[#8E5E73]" />
                 <h3 className="font-semibold text-gray-700">支出趋势 ({selectedDate}前7天)</h3>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="amount" fill="#8E5E73" radius={[4, 4, 4, 4]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20 flex-1">
             <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                 <TrendingUp size={18} className="text-gray-400" /> 统计 ({selectedDate.slice(0,4)})
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <StatBox label="本周 (Week)" total={statsWeek.total} avg={statsWeek.avg} />
                <StatBox label="本月 (Month)" total={statsMonth.total} avg={statsMonth.avg} />
                <div className="col-span-2">
                   <StatBox label="本年 (Year)" total={statsYear.total} avg={statsYear.avg} />
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20">
         <h3 className="font-semibold text-gray-700 mb-4">当日明细 ({selectedDate})</h3>
         <div className="space-y-3">
             {statsDay.records.length === 0 ? (
                 <div className="text-center text-gray-400 py-8 text-sm">当日无消费记录</div>
             ) : (
                 statsDay.records.map(log => (
                     <div key={log.id} className="flex justify-between items-center p-4 bg-[#F5F5F7] rounded-xl text-sm group">
                         <div className="flex items-center gap-4">
                            <span className="font-mono text-gray-400">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                ${log.category==='Food' ? 'bg-orange-100 text-orange-600' : 
                                  log.category==='Transport' ? 'bg-blue-100 text-blue-600' :
                                  log.category==='Shopping' ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-600'}`}>
                                {log.category}
                            </span>
                            <span className="text-gray-600 font-medium">{log.note || '无备注'}</span>
                         </div>
                         <div className="flex items-center gap-4">
                             <span className="font-bold text-gray-900 text-lg">¥{log.value.toFixed(2)}</span>
                             <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 size={16} />
                             </button>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
};
