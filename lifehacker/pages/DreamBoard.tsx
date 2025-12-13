
import React, { useEffect, useState } from 'react';
import { Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dream } from '../types';
import { StorageService } from '../services/storageService';

interface DreamBoardProps {
  onEnterApp: () => void;
  isGatekeeper: boolean;
}

export const DreamBoard: React.FC<DreamBoardProps> = ({ onEnterApp, isGatekeeper }) => {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    StorageService.getDreams().then(setDreams);
  }, []);

  return (
    <div className={`min-h-screen w-full ${isGatekeeper ? 'bg-black text-white' : 'bg-transparent text-white'} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className="px-8 md:px-16 pt-12 pb-4 flex-shrink-0 animate-fade-in z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-white">
            {isGatekeeper ? 'Vision.' : '梦想画廊'}
        </h1>
        <p className="text-lg md:text-xl font-light text-white/60 flex items-center gap-2">
           {isGatekeeper ? (
             <>
                <span>向左滑动检阅你的渴望</span>
                <ArrowRight size={18} className="animate-pulse"/>
             </>
           ) : "你的梦想蓝图"}
        </p>
      </div>

      {/* Horizontal Scroll Container 
          - flex-row: Standard Left-to-Right layout
          - flex-nowrap: Forces items to stay in one line
          - justify-start: Starts from the left
      */}
      <div className="flex-1 flex flex-row flex-nowrap items-center justify-start overflow-x-auto snap-x snap-mandatory scroll-smooth px-8 md:px-16 gap-6 md:gap-12 pb-12 pt-4 w-full hide-scrollbar">
        
        {/* Dream Cards */}
        {dreams.map((dream, index) => (
          <div 
            key={dream.id} 
            className="snap-center shrink-0 w-[85vw] md:w-[500px] h-[60vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden relative group shadow-2xl transition-transform hover:scale-[1.02] border border-white/10"
          >
            <img 
                src={dream.imageUrl} 
                alt={dream.title} 
                className="w-full h-full object-cover" 
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-10">
              <span className="text-white/40 text-sm font-mono mb-2 uppercase tracking-widest">Dream 0{index + 1}</span>
              <h3 className="text-white text-3xl md:text-4xl font-bold tracking-wide leading-tight">{dream.title}</h3>
            </div>
          </div>
        ))}
        
        {/* Placeholder if empty */}
        {dreams.length === 0 && !isGatekeeper && (
           <div className="snap-center shrink-0 w-[85vw] md:w-[500px] h-[60vh] md:h-[70vh] rounded-[2.5rem] bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-center p-8">
              <p className="text-white/50">这里还没有内容<br/>去“设置-管理梦想”添加吧</p>
           </div>
        )}

        {/* The "Start Journey" Card - Only at the FAR RIGHT END */}
        {isGatekeeper && (
           <div className="snap-center shrink-0 w-[85vw] md:w-[400px] h-[60vh] md:h-[70vh] flex items-center justify-center pl-4">
              <button 
                onClick={onEnterApp}
                className="group relative w-full h-full max-h-[400px] bg-[#8E5E73] rounded-[2.5rem] flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(142,94,115,0.3)] hover:shadow-[0_0_80px_rgba(142,94,115,0.5)] transition-all overflow-hidden border border-white/10"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Play size={32} className="text-[#8E5E73] ml-1" fill="currentColor" />
                 </div>
                 
                 <h3 className="text-3xl font-bold text-white mb-2">开启今日的逐梦之旅</h3>
                 <p className="text-white/80 text-center font-light text-sm px-4 leading-relaxed">
                    <br/>
                     最终重要的是不要忘记答应自己的事情。
                 </p>
                 
                 <div className="absolute bottom-8 flex items-center gap-2 text-white/50 text-sm font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500 delay-100">
                    Enter Workspace <ArrowRight size={14} />
                 </div>
              </button>
           </div>
        )}
        
        {/* Padding for end of scroll to ensure button isn't cut off */}
        <div className="w-8 shrink-0"></div>
      </div>
      
      {/* Scroll Hint Animation */}
      {isGatekeeper && dreams.length > 0 && (
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm font-light animate-pulse flex flex-col items-center gap-2 pointer-events-none">
            <span className="tracking-widest uppercase text-xs">Scroll to Explore</span>
            <div className="flex items-center gap-1">
                 {/* Visual cue: Content moves Left, so look Right */}
                 <span className="text-xs">向左滑动</span> 
                 <ArrowRight size={14} />
            </div>
         </div>
      )}
    </div>
  );
};

