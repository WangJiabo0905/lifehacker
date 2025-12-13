
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon, Save } from 'lucide-react';
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

      const dreamIndex = dreams.findIndex(d => d.id === editingId);
      if (dreamIndex === -1) return;

      const originalDream = dreams[dreamIndex];
      const updatedDream = { ...originalDream, title: editTitle };

      // Optimistic Update
      setDreams(prev => {
          const newDreams = [...prev];
          newDreams[dreamIndex] = updatedDream;
          return newDreams;
      });

      setEditingId(null);
      setEditTitle('');

      try {
        await StorageService.saveDream(updatedDream);
      } catch (error) {
        console.error("Failed to save dream:", error);
        alert("保存失败，请重试");
        // Revert
        setDreams(prev => {
            const newDreams = [...prev];
            newDreams[dreamIndex] = originalDream;
            return newDreams;
        });
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        <header>
            <h2 className="text-3xl font-bold text-white">管理梦想</h2>
            <p className="text-white/70 mt-1">上传图片，具象化你的渴望。随时调整目标描述。</p>
        </header>

        {/* Add New Dream Section */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/20 mb-8">
            <h3 className="font-semibold mb-4 text-[#8E5E73] flex items-center gap-2">
                <ImageIcon size={20}/>
                添加新梦想
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="给这个梦想起个名字..." 
                    className="flex-1 bg-[#F5F5F7] border border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-[#8E5E73] focus:ring-4 focus:ring-[#8E5E73]/10 text-gray-900 placeholder-gray-400 transition-all font-medium"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                <label className={`px-8 py-4 rounded-2xl cursor-pointer font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${newTitle ? 'bg-[#8E5E73] text-white hover:bg-[#7a4f61]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Plus size={20} />
                    <span>上传图片</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAddDream} disabled={!newTitle} />
                </label>
            </div>
        </div>

        {/* Dreams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dreams.map(dream => (
                <div key={dream.id} className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-white/20 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1">
                    
                    {/* Image Area - 4:3 Aspect Ratio */}
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                        <img 
                            src={dream.imageUrl} 
                            alt={dream.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        
                        {/* Hover Actions (Only when not editing) */}
                        {editingId !== dream.id && (
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-3 gap-2">
                                <button 
                                    onClick={() => startEdit(dream)}
                                    className="bg-white/90 text-gray-700 p-2.5 rounded-full hover:bg-white hover:text-[#8E5E73] shadow-lg backdrop-blur-md transition-all transform hover:scale-110"
                                    title="编辑"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(dream.id)}
                                    className="bg-white/90 text-gray-700 p-2.5 rounded-full hover:bg-white hover:text-red-500 shadow-lg backdrop-blur-md transition-all transform hover:scale-110"
                                    title="删除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Area - Display or Edit */}
                    <div className={`bg-white transition-all duration-300 ${editingId === dream.id ? 'p-3' : 'p-5 flex items-center min-h-[5rem]'}`}>
                        {editingId === dream.id ? (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <input 
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#8E5E73] focus:ring-2 focus:ring-[#8E5E73]/10 transition-all"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                    placeholder="输入新描述..."
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={cancelEdit} 
                                        className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button 
                                        onClick={saveEdit} 
                                        className="flex-1 bg-[#8E5E73] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#7a4f61] transition-colors flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <Save size={14} /> 保存
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <h4 className="font-bold text-lg text-gray-800 truncate w-full text-center tracking-tight" title={dream.title}>
                                {dream.title}
                            </h4>
                        )}
                    </div>
                </div>
            ))}
        </div>
        
        {dreams.length === 0 && (
            <div className="text-center py-20 opacity-50 border-2 border-dashed border-white/20 rounded-3xl">
                <p className="text-white text-lg">暂无梦想画面，请在上方添加。</p>
            </div>
        )}
    </div>
  );
};
