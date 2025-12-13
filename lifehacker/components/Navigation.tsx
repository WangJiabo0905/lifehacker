
import React from 'react';
import { 
  Ban, 
  Trophy, 
  Lightbulb, 
  Wallet, 
  CalendarCheck,
  Clock, 
  CreditCard,
  Settings,
  Database,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { PageView } from '../types';

interface NavigationProps {
  current: PageView;
  onChange: (page: PageView) => void;
  onTriggerTutorial: () => void;
  className?: string;
}

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-white text-[#8E5E73] shadow-md' 
        : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-sm'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} className="transition-transform group-hover:scale-105" />
    <span className="font-medium text-sm tracking-wide">{label}</span>
  </button>
);

export const Navigation: React.FC<NavigationProps> = ({ current, onChange, onTriggerTutorial, className = '' }) => {
  return (
    <nav className={`flex flex-col p-6 bg-white/5 backdrop-blur-md border-r border-white/10 sticky top-0 overflow-y-auto ${className}`}>
      <div className="mb-8 pl-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">生活黑客</h1>
      </div>
      
      <div className="space-y-1 flex-1">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 pl-4 mt-2">核心 (Core)</div>
        <NavItem icon={CalendarCheck} label="今日计划 & 复盘" active={current === 'plan'} onClick={() => onChange('plan')} />
        
        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 mt-6 pl-4">记录 (Track)</div>
        <NavItem icon={Clock} label="工作计时" active={current === 'work'} onClick={() => onChange('work')} />
        <NavItem icon={CreditCard} label="日常开销" active={current === 'expense'} onClick={() => onChange('expense')} />
        <NavItem icon={Wallet} label="理财分配" active={current === 'finance'} onClick={() => onChange('finance')} />

        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 mt-6 pl-4">清单 (Lists)</div>
        <NavItem icon={Ban} label="不为清单" active={current === 'list_not_todo'} onClick={() => onChange('list_not_todo')} />
        <NavItem icon={Trophy} label="成功日记" active={current === 'list_success'} onClick={() => onChange('list_success')} />
        <NavItem icon={Lightbulb} label="赚钱想法" active={current === 'list_ideas'} onClick={() => onChange('list_ideas')} />
        <NavItem icon={Sparkles} label="启发记录" active={current === 'list_inspiration'} onClick={() => onChange('list_inspiration')} />

        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 mt-6 pl-4">设置 (Setup)</div>
        <NavItem icon={Settings} label="管理梦想" active={current === 'dreams_manage'} onClick={() => onChange('dreams_manage')} />
        <NavItem icon={Database} label="数据资产" active={current === 'data_backup'} onClick={() => onChange('data_backup')} />
        <NavItem icon={HelpCircle} label="重看教程" active={false} onClick={onTriggerTutorial} />
      </div>
    </nav>
  );
};
