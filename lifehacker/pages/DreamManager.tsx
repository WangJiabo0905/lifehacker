
import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dream } from '../types';
import { StorageService } from '../services/storageService';

export const DreamManagerPage: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    StorageService.getDreams().then(setDreams);
  }, []);

  const handleAddDream = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && newTitle) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dream: Dream = {
          id: Date.now().toString(),
          title: newTitle,
          imageUrl: reader.result as string
        };
        await StorageService.saveDream(dream);
        setDreams(prev => [...prev, dream]);
        setNewTitle('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
      await StorageService.deleteDream(id);
      setDreams(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h2 className="text-3xl font-bold text-white">管理梦想</h2>
            <p className="text-white/70 mt-1">上传图片，具象化你的渴望。</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 mb-8">
            <h3 className="font-semibold mb-4 text-[#8E5E73]">添加新梦想</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="给这个梦想起个名字..." 
                    className="flex-1 bg-[#F5F5F7] border-none rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#8E5E73] text-gray-900"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                <label className={`px-6 py-3 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 transition-all ${newTitle ? 'bg-[#8E5E73] text-white hover:bg-[#7a4f61]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    <Plus size={18} />
                    <span>上传图片</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAddDream} disabled={!newTitle} />
                </label>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {dreams.map(dream => (
                <div key={dream.id} className="relative group rounded-xl overflow-hidden bg-white shadow-lg border border-white/20">
                    <img src={dream.imageUrl} alt={dream.title} className="w-full aspect-square object-cover" />
                    <div className="p-4">
                        <h4 className="font-bold text-gray-900 truncate">{dream.title}</h4>
                    </div>
                    <button 
                        onClick={() => handleDelete(dream.id)}
                        className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};
