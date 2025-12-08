import React, { useEffect, useState } from 'react';
import { FinanceState } from '../types';
import { StorageService } from '../services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Lock, Plane, ShoppingBag, Save, Calculator, RefreshCw } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [finance, setFinance] = useState<FinanceState>({ 
    totalIncome: 0, 
    ratios: { fixed: 30, dream: 20, desire: 50 },
    allocations: { fixedSavings: 0, dreamSavings: 0, desireSpending: 0 }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFinance(StorageService.getFinance());
  }, []);

  const recalculateAndSave = () => {
    const { fixed, dream, desire } = finance.ratios;
    const totalRatio = fixed + dream + desire;
    const factor = totalRatio > 0 ? finance.totalIncome / totalRatio : 0;
    
    const newAllocations = {
        fixedSavings: factor * fixed,
        dreamSavings: factor * dream,
        desireSpending: factor * desire
    };

    const newState = {
        ...finance,
        allocations: newAllocations
    };

    setFinance(newState);
    StorageService.saveFinance(newState);
    setIsEditing(false);
  };

  const handleRatioChange = (key: keyof typeof finance.ratios, value: string) => {
      const num = parseFloat(value) || 0;
      setFinance(prev => ({
          ...prev,
          ratios: { ...prev.ratios, [key]: num }
      }));
  };

  const data = [
    { name: '死期存储', value: finance.allocations.fixedSavings, color: '#374151' }, // Gray-700
    { name: '梦想储蓄', value: finance.allocations.dreamSavings, color: '#8E5E73' }, // Bean Paste Purple
    { name: '欲望花销', value: finance.allocations.desireSpending, color: '#D4B8C5' }, // Light Bean Paste
  ];

  const AllocationCard = ({ 
    title, 
    value, 
    ratio,
    icon: Icon, 
    colorClass, 
    ratioKey 
  }: { 
    title: string, 
    value: number, 
    ratio: number,
    icon: any, 
    colorClass: string, 
    ratioKey: keyof typeof finance.ratios
  }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 relative group transition-all hover:shadow-xl">
      <div className={`w-12 h-12 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center mb-4`}>
        <Icon className={colorClass.replace('bg-', 'text-')} size={24} />
      </div>
      <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">{title}</h3>
      
      {isEditing ? (
        <div className="mt-4">
            <label className="text-xs text-gray-400">分配比例 (%)</label>
            <input
                type="number"
                value={ratio}
                onChange={(e) => handleRatioChange(ratioKey, e.target.value)}
                className="text-2xl font-bold w-full border-b border-gray-200 outline-none focus:border-[#8E5E73] text-[#8E5E73]"
            />
        </div>
      ) : (
        <div className="mt-2">
             <div className="text-3xl font-bold text-gray-900">¥{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
             <div className="text-xs text-gray-400 mt-1">占比 {ratio}%</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">理财分配</h2>
        <button 
          onClick={() => isEditing ? recalculateAndSave() : setIsEditing(true)}
          className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg ${isEditing ? 'bg-green-600 text-white' : 'bg-white text-[#8E5E73] hover:bg-gray-100'}`}
        >
          {isEditing ? <><RefreshCw size={16}/> 重新计算并保存</> : <><Calculator size={16}/> 调整收入与比例</>}
        </button>
      </div>

      {isEditing && (
          <div className="bg-white p-6 rounded-2xl animate-fade-in shadow-lg">
              <label className="block text-sm font-bold text-[#8E5E73] uppercase mb-2">总收入输入 (Total Income)</label>
              <input 
                 type="number"
                 value={finance.totalIncome}
                 onChange={(e) => setFinance({...finance, totalIncome: parseFloat(e.target.value) || 0})}
                 className="w-full text-4xl bg-transparent border-b-2 border-[#8E5E73] outline-none text-gray-800 font-light py-2"
                 placeholder="输入您的总收入..."
              />
              <p className="text-gray-500 text-sm mt-2">修改下方卡片中的比例，点击保存以自动分配。</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AllocationCard 
          title="死期存储 (Fixed)" 
          value={finance.allocations.fixedSavings} 
          ratio={finance.ratios.fixed}
          icon={Lock} 
          colorClass="bg-gray-700 text-gray-700" 
          ratioKey="fixed"
        />
        <AllocationCard 
          title="梦想储蓄金 (Dreams)" 
          value={finance.allocations.dreamSavings} 
          ratio={finance.ratios.dream}
          icon={Plane} 
          colorClass="bg-[#8E5E73] text-[#8E5E73]" 
          ratioKey="dream"
        />
        <AllocationCard 
          title="欲望花销 (Desire)" 
          value={finance.allocations.desireSpending} 
          ratio={finance.ratios.desire}
          icon={ShoppingBag} 
          colorClass="bg-[#D4B8C5] text-[#D4B8C5]" 
          ratioKey="desire"
        />
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-white/20 flex flex-col md:flex-row items-center justify-around min-h-[400px]">
        <div className="w-full md:w-1/2 h-64">
           {finance.totalIncome > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                   itemStyle={{color: '#000'}}
                />
              </PieChart>
            </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-400">请输入收入以查看分配概览</div>
           )}
        </div>
        
        <div className="w-full md:w-1/3 space-y-4">
           <h3 className="text-lg font-semibold mb-4 text-gray-900">资产构成</h3>
           {data.map((item) => (
             <div key={item.name} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-sm font-medium text-gray-700">{item.name}</span>
               </div>
               <span className="font-bold text-gray-900">¥{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
             </div>
           ))}
           <div className="flex justify-between items-center p-3 pt-6 border-t border-gray-100">
              <span className="text-gray-500 font-medium">总收入</span>
              <span className="text-xl font-bold text-gray-900">¥{finance.totalIncome.toLocaleString()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};