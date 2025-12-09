
import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
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
    <div className={`min-h-screen p-8 ${isGatekeeper ? 'bg-black text-white' : 'bg-transparent text-white'}`}>
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-white">{isGatekeeper ? 'Vision.' : '梦想相册'}</h1>
          <p className={`text-xl font-light max-w-2xl ${isGatekeeper ? 'text-gray-400' : 'text-white/80'}`}>
            "只有疯狂到认为自己可以改变世界的人才能改变世界"
          </p>
        </div>
        
        {isGatekeeper && (
          <button 
            onClick={onEnterApp}
            className="group flex items-center gap-3 bg-[#8E5E73] text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(142,94,115,0.4)]"
          >
            <span>开启今日</span>
            <Play size={20} fill="currentColor" />
          </button>
        )}
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {dreams.map(dream => (
          <div key={dream.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-2xl">
            <img src={dream.imageUrl} alt={dream.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <h3 className="text-white text-xl font-bold tracking-wide">{dream.title}</h3>
            </div>
          </div>
        ))}
        
        {/* Placeholder if empty */}
        {dreams.length === 0 && (
          <div className="break-inside-avoid rounded-2xl overflow-hidden opacity-50 grayscale border border-white/20 bg-white/5">
            <div className="aspect-[3/4] flex items-center justify-center text-white/50 text-center p-8">
                还没有添加梦想。<br/>请进入应用后在“设置”中管理梦想。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
