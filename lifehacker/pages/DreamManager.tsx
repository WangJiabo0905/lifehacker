
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Dream } from '../types';
import { StorageService } from '../services/storageService';

export const DreamManagerPage: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [newTitle, setNewTitle] = useState('');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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
      if(confirm("确定要删除这个梦想画面吗？")) {
        await StorageService.deleteDream(id);
        setDreams(prev => prev.filter(d => d.id !== id));
      }
  };

  const startEdit = (dream: Dream) => {
      setEditingId(dream.id);
      setEditTitle(dream.title);
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditTitle('');
  };

  const saveEdit = async () => {
      if (!editingId || !editTitle.trim()) return;

      // Find the dream being edited from the current state to ensure data freshness
      const dreamIndex = dreams.findIndex(d => d.id === editingId);
      if (dreamIndex === -1) return;

      const originalDream = dreams[dreamIndex];
      const updatedDream = { ...originalDream, title: editTitle };

      // Optimistic Update: Update UI immediately
      setDreams(prev => {
          const newDreams = [...prev];
          newDreams[dreamIndex] = updatedDream;
          return newDreams;
      });

      // Reset edit state immediately for better UX
      setEditingId(null);
      setEditTitle('');

      // Persist to storage
      try {
        await StorageService.saveDream(updatedDream);
      } catch (error) {
        console.error("Failed to save dream:", error);
        alert("保存失败，请重试");
        // Revert on failure (optional, but good practice)
        setDreams(prev => {
            const newDreams = [...prev];
            newDreams[dreamIndex] = originalDream;
            return newDreams;
        });
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          saveEdit();
      } else if (e.key === 'Escape') {
          cancelEdit();
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        <header>
            <h2 className="text-3xl font-bold text-white">管理梦想</h2>
            <p className="text-white/70 mt-1">上传图片，具象化你的渴望。您可以随时编辑文字描述。</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 mb-8">
            <h3 className="font-semibold mb-4 text-[#8E5E73]">添加新梦想</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="给这个梦想起个名字..." 
                    className="flex-1 bg-[#F5F5F7] border-none rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#8E5E73] text-gray-900 placeholder-gray-400"
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
                <div key={dream.id} className="relative group rounded-2xl overflow-hidden bg-white shadow-lg border border-white/20 flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Fixed aspect ratio (4:3) for uniformity */}
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                        <img 
                            src={dream.imageUrl} 
                            alt={dream.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        
                        {/* Overlay Actions - Only show if NOT editing */}
                        {editingId !== dream.id && (
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                <button 
                                    onClick={() => startEdit(dream)}
                                    className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white hover:text-[#8E5E73] shadow-sm backdrop-blur-sm transition-colors"
                                    title="编辑描述"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(dream.id)}
                                    className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white hover:text-red-500 shadow-sm backdrop-blur-sm transition-colors"
                                    title="删除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white flex-1 flex items-center min-h-[4.5rem]">
                        {editingId === dream.id ? (
                            <div className="flex items-center gap-2 w-full animate-fade-in">
                                <input 
                                    type="text"
                                    className="flex-1 bg-[#F5F5F7] px-3 py-2 rounded-lg text-sm outline-none border border-transparent focus:border-[#8E5E73] text-gray-900"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={handleKeyDown}
                                />
                                <button onClick={saveEdit} className="text-green-600 p-1.5 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"><Check size={18}/></button>
                                <button onClick={cancelEdit} className="text-gray-400 p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"><X size={18}/></button>
                            </div>
                        ) : (
                            <h4 className="font-bold text-gray-900 truncate w-full text-center" title={dream.title}>{dream.title}</h4>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

