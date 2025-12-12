
import React, { useEffect, useState } from 'react';
import { FinanceState } from '../types';
import { StorageService } from '../services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Lock, Plane, ShoppingBag, Calculator, Plus, ArrowDown, Settings } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [finance, setFinance] = useState<FinanceState>({ 
    totalIncome: 0, 
    ratios: { fixed: 30, dream: 20, desire: 50 },
    allocations: { fixedSavings: 0, dreamSavings: 0, desireSpending: 0 }
  });

  const [newIncome, setNewIncome] = useState<string>('');
  const [isSettingRatios, setIsSettingRatios] = useState(false);

  useEffect(() => {
    StorageService.getFinance().then(setFinance);
  }, []);

  const handleDeposit = async () => {
      const incomeVal = parseFloat(newIncome);
      if (!incomeVal || incomeVal <= 0) return;

      const { fixed, dream, desire } = finance.ratios;
      const totalRatio = fixed + dream + desire;
      
      // Calculate how much to ADD to each bucket
      const addFixed = totalRatio > 0 ? incomeVal * (fixed / totalRatio) : 0;
      const addDream = totalRatio > 0 ? incomeVal * (dream / totalRatio) : 0;
      const addDesire = totalRatio > 0 ? incomeVal * (desire / totalRatio) : 0;

      const newState = {
          ...finance,
          allocations: {
              fixedSavings: finance.allocations.fixedSavings + addFixed,
              dreamSavings: finance.allocations.dreamSavings + addDream,
              desireSpending: finance.allocations.desireSpending + addDesire
          }
      };

      await StorageService.saveFinance(newState);
      setFinance(newState);
      setNewIncome(''); // Reset input
      alert(`已成功分配 ¥${incomeVal.toLocaleString()} 到三个账户！`);
  };

  const handleBalanceChange = async (key: keyof typeof finance.allocations, newValStr: string) => {
      const val = parseFloat(newValStr);
      // Allow empty string for typing, but save as 0 if invalid
      if (isNaN(val)) return; 

      const newState = {
          ...finance,
          allocations: {
              ...finance.allocations,
              [key]: val
          }
      };
      setFinance(newState);
      await StorageService.saveFinance(newState);
  };

  const handleRatioChange = async (key: keyof typeof finance.ratios, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const newState = {
        ...finance,
        ratios: {
            ...finance.ratios,
            [key]: val
        }
    };
    setFinance(newState);
    await StorageService.saveFinance(newState);
  };

  const data = [
    { name: '死期存储', value: finance.allocations.fixedSavings, color: '#374151' },
    { name: '梦想储蓄', value: finance.allocations.dreamSavings, color: '#8E5E73' },
    { name: '欲望花销', value: finance.allocations.desireSpending, color: '#D4B8C5' },
  ];

  const AllocationCard = ({ 
    title, 
    value, 
    ratio,
    icon: Icon, 
    colorClass, 
    allocKey,
    ratioKey 
  }: { 
    title: string, 
    value: number, 
    ratio: number,
    icon: any, 
    colorClass: string, 
    allocKey: keyof typeof finance.allocations,
    ratioKey: keyof typeof finance.ratios
  }) => (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20 relative group transition-all hover:shadow-xl overflow-hidden">
      <div className={`w-12 h-12 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center mb-4`}>
        <Icon className={colorClass.replace('bg-', 'text-')} size={24} />
      </div>
      
      <div className="flex justify-between items-start mb-2">
         <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider">{title}</h3>
         {isSettingRatios && (
             <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                 <span className="text-xs text-gray-400">Ratio:</span>
                 <input 
                    type="number" 
                    value={ratio} 
                    onChange={(e) => handleRatioChange(ratioKey, e.target.value)}
                    className="w-8 bg-transparent text-xs font-bold outline-none text-right"
                 />
                 <span className="text-xs text-gray-400">%</span>
             </div>
         )}
         {!isSettingRatios && <span className="text-xs text-gray-300 font-medium">{ratio}% of income</span>}
      </div>
      
      <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400 select-none">¥</span>
          <input
            type="number"
            value={Math.floor(value)} // Show integer for cleaner look usually, or remove Math.floor
            onChange={(e) => handleBalanceChange(allocKey, e.target.value)}
            className="w-full pl-6 text-3xl font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#8E5E73] outline-none transition-colors py-1"
          />
      </div>
      <p className="text-xs text-gray-400 mt-2">可直接编辑余额 (例如支出后扣减)</p>
    </div>
  );

  const totalAssets = finance.allocations.fixedSavings + finance.allocations.dreamSavings + finance.allocations.desireSpending;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white">理财分配</h2>
            <p className="text-white/70 mt-1">收入分配与资产管理</p>
        </div>
        <button 
          onClick={() => setIsSettingRatios(!isSettingRatios)}
          className={`p-3 rounded-full transition-all ${isSettingRatios ? 'bg-white text-[#8E5E73]' : 'bg-white/10 text-white hover:bg-white/20'}`}
          title="设置分配比例"
        >
          <Settings size={20}/>
        </button>
      </div>

      {/* Income Deposit Section */}
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/20 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">新收入入账 (Deposit Income)</label>
              <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-light text-2xl group-focus-within:text-[#8E5E73] transition-colors">¥</span>
                  <input 
                    type="number"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    className="w-full bg-[#F5F5F7] rounded-2xl py-4 pl-10 pr-4 text-2xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#8E5E73]/20 transition-all placeholder:text-gray-300"
                    placeholder="输入金额..."
                  />
              </div>
          </div>
          
          <ArrowDown className="hidden md:block text-gray-300" size={24} />
          
          <button 
             onClick={handleDeposit}
             disabled={!newIncome}
             className="w-full md:w-auto px-8 py-4 bg-[#8E5E73] text-white rounded-2xl font-bold text-lg hover:bg-[#7a4f61] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
          >
             <Calculator size={20} />
             <span>一键分配</span>
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AllocationCard 
          title="死期存储 (Fixed)" 
          value={finance.allocations.fixedSavings} 
          ratio={finance.ratios.fixed}
          icon={Lock} 
          colorClass="bg-gray-700 text-gray-700" 
          allocKey="fixedSavings"
          ratioKey="fixed"
        />
        <AllocationCard 
          title="梦想储蓄金 (Dreams)" 
          value={finance.allocations.dreamSavings} 
          ratio={finance.ratios.dream}
          icon={Plane} 
          colorClass="bg-[#8E5E73] text-[#8E5E73]" 
          allocKey="dreamSavings"
          ratioKey="dream"
        />
        <AllocationCard 
          title="欲望花销 (Desire)" 
          value={finance.allocations.desireSpending} 
          ratio={finance.ratios.desire}
          icon={ShoppingBag} 
          colorClass="bg-[#D4B8C5] text-[#D4B8C5]" 
          allocKey="desireSpending"
          ratioKey="desire"
        />
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-white/20 flex flex-col md:flex-row items-center justify-around min-h-[400px]">
        <div className="w-full md:w-1/2 h-64 relative">
           {totalAssets > 0 ? (
            <>
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
                   formatter={(value: number) => `¥${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Assets</p>
                    <p className="text-2xl font-bold text-gray-800">¥{totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
            </div>
            </>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-400">暂无资产数据</div>
           )}
        </div>
        
        <div className="w-full md:w-1/3 space-y-4 mt-8 md:mt-0">
           <h3 className="text-lg font-bold mb-4 text-gray-900">资产构成</h3>
           {data.map((item) => (
             <div key={item.name} className="flex justify-between items-center p-4 rounded-2xl bg-[#F5F5F7]">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-sm font-medium text-gray-700">{item.name}</span>
               </div>
               <span className="font-bold text-gray-900">¥{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
