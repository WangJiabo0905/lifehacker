
import React, { useEffect, useState } from 'react';
import { X, ChevronRight, Check, Sparkles, ArrowRight, Zap, Skull } from 'lucide-react';
import { PageView } from '../types';

interface OnboardingProps {
  currentView: PageView;
  onChangeView: (view: PageView) => void;
  onClose: () => void;
  mode: 'TOUR' | 'UPDATE'; // TOUR = Full tutorial, UPDATE = What's new
}

// UPDATE THIS VERSION STRING WHENEVER YOU SHIP NEW FEATURES
export const CURRENT_VERSION = '1.2.0-void-system'; 

const TOUR_STEPS: { title: string; desc: string; targetView: PageView }[] = [
  {
    title: "欢迎来到生活黑客",
    desc: "这是一个极简主义的个人管理系统，旨在帮助你夺回生活的掌控权。让我们花 30 秒了解核心功能。",
    targetView: 'plan'
  },
  {
    title: "每日计划 (Plan)",
    desc: "这是你的控制台。每天早晨设定任务，每晚进行复盘。支持批量规划和周期性任务。",
    targetView: 'plan'
  },
  {
    title: "工作计时 (Flow)",
    desc: "记录你的深度工作时间。利用“一万小时定律”追踪技能精进，从新手到传奇大师。",
    targetView: 'work'
  },
  {
    title: "财务分配 (Assets)",
    desc: "不仅仅是记账。我们采用三分法：死期存储、梦想基金和欲望花销，帮助你理清金钱关系。",
    targetView: 'finance'
  },
  {
    title: "不为清单 (Principles)",
    desc: "记录原则。当破戒次数过多时，系统会发生视觉异化，警示你的沉沦。",
    targetView: 'list_not_todo'
  },
  {
    title: "梦想相册 (Vision)",
    desc: "一切的起点。在这里具象化你的渴望，每次启动应用时，我们都会提醒你为何出发。",
    targetView: 'dreams_view'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ currentView, onChangeView, onClose, mode }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // If in Tour mode, sync the view with the current step
    if (mode === 'TOUR') {
      onChangeView(TOUR_STEPS[0].targetView);
    }
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      onChangeView(TOUR_STEPS[nextStep].targetView);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  // --- RENDER: UPDATE NOTIFICATION MODE ---
  if (mode === 'UPDATE') {
      return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-[#1C1C1E] text-white max-w-md w-full rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Visual Flair for the Update */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-500/20">
                        <Skull size={24} />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">更新：深渊凝视</h2>
                    <p className="text-white/50 text-sm mb-6">版本 {CURRENT_VERSION}</p>
                    
                    <div className="space-y-4 text-sm text-gray-300 leading-relaxed mb-8">
                        <p>
                            <strong className="text-white">视觉异化系统：</strong> 当“不为清单”中的某项原则破戒超过 6 次，卡片将彻底黑化并出现故障效果(Glitch)，按钮变为“继续沉沦”。
                        </p>
                        <p>
                            <strong className="text-white">救赎仪式：</strong> 想要重置黑化的原则？你必须手动输入承诺语句进行“重铸”。
                        </p>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                        <span>了解，继续</span>
                        <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER: TOUR MODE ---
  const currentStepData = TOUR_STEPS[step];

  return (
    <div className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center p-6 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Click outside to skip */}
      <div className="absolute inset-0" onClick={handleClose}></div>

      <div className="bg-white max-w-md w-full rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 animate-fade-in border border-white/20">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={20} />
        </button>

        <div className="mb-2 flex items-center gap-2">
            <span className="bg-[#8E5E73] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                STEP {step + 1}/{TOUR_STEPS.length}
            </span>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3 h-16 flex items-center">
            {currentStepData.title}
        </h3>
        
        <p className="text-gray-500 leading-relaxed mb-8 h-20">
            {currentStepData.desc}
        </p>

        <div className="flex items-center gap-3">
            {step > 0 && (
                <button 
                    onClick={() => {
                        const prev = step - 1;
                        setStep(prev);
                        onChangeView(TOUR_STEPS[prev].targetView);
                    }}
                    className="px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-gray-100 transition-colors"
                >
                    上一步
                </button>
            )}
            <button 
                onClick={handleNext}
                className="flex-1 bg-[#8E5E73] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-[#7a4f61] transition-all flex items-center justify-center gap-2"
            >
                {step === TOUR_STEPS.length - 1 ? (
                    <>
                        <Check size={18} />
                        <span>开始使用</span>
                    </>
                ) : (
                    <>
                        <span>下一步</span>
                        <ChevronRight size={18} />
                    </>
                )}
            </button>
        </div>
        
        <div className="mt-6 flex justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#8E5E73]' : 'w-1.5 bg-gray-200'}`}
                />
            ))}
        </div>
      </div>
    </div>
  );
};
