
import React, { useEffect, useState } from 'react';
import { ListItem } from '../types';
import { StorageService } from '../services/storageService';
import { Trash2, Plus, Calendar, Sparkles, ChevronDown, ChevronUp, Download, Book, PenTool, Quote } from 'lucide-react';

interface ListsProps {
  type: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION';
}

const CONFIG = {
  NOT_TO_DO: {
    title: "不为清单",
    desc: "决定不做什么，往往比决定做什么更重要。",
    placeholder: "我绝不再...",
    color: "text-white",
    keyName: "NOT_TO_DO",
    showCategory: false
  },
  SUCCESS: {
    title: "成功日记",
    desc: "记录每一个小小的胜利，它们将汇聚成江海。",
    placeholder: "今天我成功地...",
    color: "text-white",
    keyName: "SUCCESS",
    showCategory: false
  },
  IDEAS: {
    title: "赚钱想法",
    desc: "捕捉每一个稍纵即逝的灵感和价值创造机会。",
    placeholder: "我想到了一个关于...的点子",
    color: "text-white",
    keyName: "IDEAS",
    showCategory: false
  },
  INSPIRATION: {
    title: "启发记录",
    desc: "那些击中灵魂的句子、书籍与文章。",
    placeholder: "输入内容...",
    color: "text-white",
    keyName: "INSPIRATION",
    showCategory: true
  }
};

export const ListsPage: React.FC<ListsProps> = ({ type }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  
  // Tabs: 'sentence', 'book', 'article'
  const [activeTab, setActiveTab] = useState<'sentence' | 'book' | 'article'>('sentence');
  
  // Extra Inputs
  const [author, setAuthor] = useState('');
  const [articleContent, setArticleContent] = useState(''); 

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const config = CONFIG[type];

  // Load data asynchronously
  useEffect(() => {
    StorageService.getList(type).then(setItems);
  }, [type]);

  // Reset inputs on tab change
  useEffect(() => {
    setNewItem('');
    setAuthor('');
    setArticleContent('');
  }, [activeTab]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    const categoryToSave = type === 'INSPIRATION' ? activeTab : undefined;

    const item: ListItem = {
      id: Date.now().toString(),
      text: newItem,
      createdAt: new Date().toISOString(),
      category: categoryToSave,
      author: (type === 'INSPIRATION' && (activeTab === 'book' || activeTab === 'article')) ? author : undefined,
      content: (type === 'INSPIRATION' && activeTab === 'article') ? articleContent : undefined,
    };

    try {
        await StorageService.saveListItem(type, item);
        setItems(prev => [item, ...prev]); 
        
        setNewItem('');
        setAuthor('');
        setArticleContent('');
    } catch (error: any) {
        alert("保存失败，请重试。\n" + error.message);
    }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("确定要删除这条记录吗？")) {
        await StorageService.deleteListItem(type, id);
        setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({...prev, [id]: !prev[id]}));
  };

  const exportInspiration = async () => {
    // Get inspiration data specifically
    const inspirationList = await StorageService.getList('INSPIRATION');
    const data = {
        inspiration: inspirationList,
        exportDate: new Date().toISOString(),
        note: "Essence Inspiration Pack - 启发记录包"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Essence_Inspiration_Pack_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayedItems = type === 'INSPIRATION' 
    ? items.filter(i => i.category === activeTab)
    : items;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="text-center space-y-4 py-8 relative">
        <h2 className={`text-4xl font-bold tracking-tight ${config.color} flex items-center justify-center gap-3`}>
            {type === 'INSPIRATION' && <Sparkles size={32}/>}
            {config.title}
        </h2>
        <p className="text-white/70 text-lg font-light">{config.desc}</p>
        
        {type === 'INSPIRATION' && (
             <button 
             onClick={exportInspiration}
             className="absolute right-0 top-1/2 -translate-y-1/2 md:top-8 text-white bg-white/10 hover:bg-white/20 flex items-center gap-2 text-sm border border-white/20 px-4 py-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
             title="单独下载启发记录包"
           >
             <Download size={16} /> 
             <span className="hidden md:inline">下载记录包</span>
           </button>
        )}
      </header>

      {/* Tabs for Inspiration */}
      {type === 'INSPIRATION' && (
          <div className="flex justify-center mb-8">
              <div className="bg-black/20 backdrop-blur-sm p-1.5 rounded-2xl flex gap-2 shadow-inner">
                  <button 
                    onClick={() => setActiveTab('sentence')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'sentence' ? 'bg-white text-[#8E5E73] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                      <Quote size={16} /> 句子
                  </button>
                  <button 
                    onClick={() => setActiveTab('book')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'book' ? 'bg-white text-[#8E5E73] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                      <Book size={16} /> 书籍
                  </button>
                  <button 
                    onClick={() => setActiveTab('article')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'article' ? 'bg-white text-[#8E5E73] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                      <PenTool size={16} /> 文章
                  </button>
              </div>
          </div>
      )}

      <form onSubmit={add} className="bg-white rounded-3xl p-2 shadow-lg shadow-black/10 border border-white/20 relative z-10">
        <div className="flex flex-col gap-2 p-2">
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={
                    type === 'INSPIRATION' 
                        ? (activeTab === 'book' ? "书名..." : activeTab === 'article' ? "文章标题..." : "输入那个击中你的句子...") 
                        : config.placeholder
                }
                className="flex-1 bg-transparent text-lg p-4 outline-none text-gray-800 placeholder:text-gray-300"
              />
              
              {(type === 'INSPIRATION' && (activeTab === 'book' || activeTab === 'article')) && (
                  <input 
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="作者 (可选)"
                      className="w-full md:w-32 bg-gray-50 rounded-xl px-4 py-2 md:py-0 outline-none text-sm text-gray-700 focus:bg-gray-100 transition-colors"
                  />
              )}

              <button 
                type="submit" 
                className="bg-[#8E5E73] text-white rounded-xl aspect-square w-full md:w-14 h-14 md:h-auto flex items-center justify-center hover:bg-[#7a4f61] hover:scale-95 transition-all shadow-md"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Extra Inputs based on active Tab */}
            {type === 'INSPIRATION' && activeTab === 'article' && (
                <div className="px-2 pb-2 animate-fade-in">
                    <textarea
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        placeholder="在此处粘贴文章的段落或完整内容..."
                        className="w-full bg-gray-50 rounded-xl p-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#8E5E73]/10 min-h-[120px] resize-y transition-shadow"
                    />
                </div>
            )}
        </div>
      </form>

      <div className="space-y-4">
        {displayedItems.map(item => (
          <div 
            key={item.id} 
            className={`group bg-white rounded-2xl shadow-sm border border-white/10 overflow-hidden transition-all hover:shadow-lg ${item.category === 'article' ? 'cursor-pointer' : ''}`}
            onClick={() => item.category === 'article' && toggleExpand(item.id)}
          >
            <div className="p-6 flex justify-between items-start">
                <div className="space-y-3 w-full">
                    <div className="flex items-start gap-4">
                        {item.category === 'sentence' && <Quote size={20} className="text-[#8E5E73]/40 mt-1 flex-shrink-0" />}
                        {item.category === 'book' && <Book size={20} className="text-[#8E5E73]/40 mt-1 flex-shrink-0" />}
                        {item.category === 'article' && <PenTool size={20} className="text-[#8E5E73]/40 mt-1 flex-shrink-0" />}
                        
                        <div className="flex-1">
                                <p className={`text-lg text-gray-800 leading-relaxed font-medium ${item.category === 'sentence' ? 'italic font-serif text-gray-600' : ''}`}>
                                    {item.text}
                                </p>
                                {item.author && (
                                    <p className="text-sm text-gray-400 mt-2 font-medium">—— {item.author}</p>
                                )}
                        </div>
                        
                        {item.category === 'article' && (
                            <div className="text-gray-300">
                                {expandedItems[item.id] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-300 font-medium pl-9">
                        <Calendar size={12} />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <button 
                onClick={(e) => remove(item.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-2 flex-shrink-0 ml-2"
                >
                <Trash2 size={18} />
                </button>
            </div>
            
            {item.category === 'article' && expandedItems[item.id] && item.content && (
                <div className="px-6 pb-6 pt-0 animate-fade-in cursor-text" onClick={e => e.stopPropagation()}>
                    <div className="bg-gray-50 rounded-xl p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-serif border-l-4 border-[#8E5E73]/30 ml-9">
                        {item.content}
                    </div>
                </div>
            )}
          </div>
        ))}
        
        {displayedItems.length === 0 && (
          <div className="text-center text-white/40 py-12 flex flex-col items-center gap-4">
            <Sparkles size={48} className="opacity-50"/>
            <p>
                {type === 'INSPIRATION' 
                    ? `这里还没有${activeTab === 'sentence' ? '句子' : activeTab === 'book' ? '书籍' : '文章'}记录。` 
                    : "暂无记录。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
