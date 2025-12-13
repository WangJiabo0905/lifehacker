
import React, { useEffect, useState } from 'react';
import { Play, ArrowRight, Plus } from 'lucide-react';
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
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      {/* 
         Scroll Container: 
         - Full Width/Height
         - Snap to center ensures one item per screen
         - 'items-stretch' makes children fill height
      */}
      <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar items-stretch">
        
        {/* 1. INTRO / COVER SLIDE (Only in Gatekeeper Mode) 
            This forces the user to start with a title screen before seeing any dreams or buttons.
        */}
        {isGatekeeper && (
            <div className="min-w-full h-full snap-center snap-always flex flex-col items-center justify-center relative p-8 shrink-0 bg-black">
                <div className="max-w-md text-center space-y-8 animate-fade-in z-10">
                    <h1 className="text-7xl md:text-8xl font-bold tracking-tighter text-white">梦想相册</h1>
                    <div className="w-16 h-1 bg-[#8E5E73] mx-auto rounded-full"></div>
                    <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed tracking-wide">
                        不要忘记你的渴望<br/>
                        <span className="text-base opacity-50 mt-2 block font-normal">确认航向，再出发</span>
                    </p>
                </div>
                
                {/* Visual Hint at bottom */}
                <div className="absolute bottom-16 flex flex-col items-center gap-3 opacity-40 animate-pulse">
                    <span className="text-xs uppercase tracking-[0.3em] font-medium">Swipe Left</span>
                    <ArrowRight size={24} />
                </div>
            </div>
        )}

        {/* 2. DREAM CARDS LOOP 
            Each dream takes up a full screen width (min-w-full).
        */}
        {dreams.map((dream, index) => (
            <div key={dream.id} className="min-w-full h-full snap-center snap-always flex items-center justify-center p-6 md:p-12 shrink-0 relative">
                {/* Background Blur for atmosphere */}
                <div 
                    className="absolute inset-0 opacity-20 blur-3xl scale-125"
                    style={{ backgroundImage: `url(${dream.imageUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                ></div>

                <div className="w-full max-w-[500px] aspect-[3/5] md:aspect-[3/4] relative rounded-[3rem] overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.8)] border border-white/10 group z-10 bg-[#121212]">
                    <img 
                        src={dream.imageUrl} 
                        alt={dream.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ease-out" 
                    />
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10 md:p-12">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <span className="text-[#8E5E73] font-mono text-sm tracking-[0.2em] mb-3 block">0{index + 1}</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">{dream.title}</h2>
                        </div>
                    </div>
                </div>
            </div>
        ))}

        {/* Fallback if No Dreams 
            Ensures the flow isn't broken if data is empty.
        */}
        {dreams.length === 0 && (
             <div className="min-w-full h-full snap-center snap-always flex items-center justify-center p-8 shrink-0 bg-black/50">
                 <div className="text-center space-y-6 opacity-40 border-2 border-dashed border-white/20 p-16 rounded-[3rem]">
                     <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                        <Plus size={40} />
                     </div>
                     <p className="text-xl font-light">暂无梦想画面</p>
                     <p className="text-sm">进入后请前往“设置”添加</p>
                 </div>
             </div>
        )}

        {/* 3. FINAL START SLIDE (Only in Gatekeeper)
            This is strictly the LAST item. User MUST scroll here to see it.
        */}
        {isGatekeeper && (
            <div className="min-w-full h-full snap-center snap-always flex flex-col items-center justify-center p-8 shrink-0 bg-black relative">
                <button 
                    onClick={onEnterApp}
                    className="group relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-[#8E5E73] flex flex-col items-center justify-center shadow-[0_0_100px_rgba(142,94,115,0.4)] hover:shadow-[0_0_150px_rgba(142,94,115,0.6)] hover:scale-105 transition-all duration-500 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <Play size={80} className="fill-white text-white mb-4 relative z-10 ml-3 transition-transform duration-500 group-hover:scale-110" />
                    <span className="text-xl font-bold text-white relative z-10 tracking-widest mt-2">开启你的逐梦之旅</span>
                </button>
                
                <p className="mt-12 text-white/30 text-sm font-light tracking-widest uppercase animate-pulse">
                    Make it happen
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
