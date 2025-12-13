
import React, { useEffect, useState } from 'react';
import { ListItem } from '../types';
import { StorageService } from '../services/storageService';
import { Trash2, Plus, Calendar, Sparkles, ChevronDown, ChevronUp, Download, Book, PenTool, Quote, Zap, Shield, ShieldAlert, Fingerprint, AlertTriangle, Skull, RefreshCw, X } from 'lucide-react';

interface ListsProps {
  type: 'NOT_TO_DO' | 'SUCCESS' | 'IDEAS' | 'INSPIRATION';
}

const CONFIG = {
  NOT_TO_DO: {
    title: "不为清单",
    desc: "选择不做什么，比做什么更重要",
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
  
  // Redemption Modal State
  const [redemptionTarget, setRedemptionTarget] = useState<ListItem | null>(null);
  const [redemptionInput, setRedemptionInput] = useState('');

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
      breaks: [], // Initialize empty breaks
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

  const handleUpdateItem = async (updatedItem: ListItem) => {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      await StorageService.saveListItem(type, updatedItem);
  };

  const recordBreak = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const item = items.find(i => i.id === id);
      if (!item) return;

      const currentBreaks = item.breaks || [];
      
      // If already heavily corrupted (6+), open Redemption Menu instead of auto-adding
      if (currentBreaks.length >= 6) {
          setRedemptionTarget(item);
          setRedemptionInput('');
          return;
      }
      
      // Normal Logic: Add Break
      const updatedItem = { ...item, breaks: [...currentBreaks, new Date().toISOString()] };
      await handleUpdateItem(updatedItem);
  };

  // Logic for the Redemption Modal
  const handleRedeem = async () => {
      if (!redemptionTarget) return;
      if (redemptionInput !== '我找回了我的原则') return;

      const updatedItem = { ...redemptionTarget, breaks: [] }; // Reset to pure
      await handleUpdateItem(updatedItem);
      setRedemptionTarget(null);
  };

  const handleCorruptMore = async () => {
      if (!redemptionTarget) return;
      const currentBreaks = redemptionTarget.breaks || [];
      const updatedItem = { ...redemptionTarget, breaks: [...currentBreaks, new Date().toISOString()] };
      await handleUpdateItem(updatedItem);
      setRedemptionTarget(null);
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

  // --- STYLE HELPERS ---
  const getItemStyles = (count: number) => {
      if (count === 0) {
          return {
              container: 'bg-white border-white/10 hover:shadow-lg',
              text: 'text-gray-800',
              icon: Shield,
              iconColor: 'text-gray-300',
              label: 'PURE',
              labelClass: 'bg-gray-100 text-gray-400',
              btnText: '破戒',
              buttonClass: 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          };
      }
      if (count < 3) {
          return {
              container: 'bg-[#F5F5F7] border-gray-200 hover:shadow-lg',
              text: 'text-gray-900',
              icon: ShieldAlert,
              iconColor: 'text-gray-400',
              label: 'BROKEN',
              labelClass: 'bg-gray-200 text-gray-600 font-bold',
              btnText: '再次破戒',
              buttonClass: 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
          };
      }
      if (count < 6) {
          return {
              container: 'bg-[#E5E5EA] border-gray-300 shadow-inner',
              text: 'text-gray-900 font-bold',
              icon: AlertTriangle,
              iconColor: 'text-gray-600',
              label: 'WARNING',
              labelClass: 'bg-gray-300 text-gray-800 font-bold',
              btnText: '失控',
              buttonClass: 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
          };
      }
      // Level 3: The Void (6+) - Glitch Effect applied in render
      return {
          container: 'bg-[#0f0f0f] border-red-900/30 shadow-2xl scale-[1.01] animate-pulse-slow relative overflow-hidden',
          text: 'text-red-50 font-bold tracking-widest font-mono opacity-90',
          icon: Skull,
          iconColor: 'text-red-500/50',
          label: 'VOID',
          labelClass: 'bg-red-900/50 text-red-200 font-black tracking-widest border border-red-500/20',
          btnText: '继续沉沦',
          buttonClass: 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30'
      };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Glitch Animation Keyframes */}
      <style>{`
        @keyframes glitch-anim {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .glitch-hover:hover {
            animation: glitch-anim 0.3s infinite;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* --- REDEMPTION MODAL --- */}
      {redemptionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="bg-[#121212] border border-red-900/30 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
                  
                  <div className="text-center space-y-4 mb-6">
                      <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                          <Skull className="text-red-500 absolute animate-pulse" size={32} />
                          <Skull className="text-red-500 absolute opacity-50 translate-x-1" size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-red-50 tracking-tight">原则已崩塌</h3>
                      <p className="text-red-200/50 text-sm font-mono">
                          "{redemptionTarget.text}" 已被打破 {redemptionTarget.breaks?.length} 次。
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                          此原则已堕入虚空。要重置计数，你必须进行<strong>重铸仪式</strong>，或者选择继续记录这份失败。
                      </p>
                  </div>

                  <div className="space-y-4">
                      <div className="relative">
                          <input 
                              type="text" 
                              value={redemptionInput}
                              onChange={(e) => setRedemptionInput(e.target.value)}
                              placeholder="输入：我找回了我的原则"
                              className="w-full bg-black border border-white/10 rounded-xl p-4 text-center text-white outline-none focus:border-red-500/50 transition-colors placeholder:text-gray-700"
                          />
                      </div>

                      <div className="flex gap-3">
                          <button 
                            onClick={handleCorruptMore}
                            className="flex-1 py-4 bg-red-950/30 text-red-400 rounded-xl font-bold hover:bg-red-950/50 transition-colors border border-red-900/20 text-xs tracking-wider"
                          >
                              继续沉沦 (+1)
                          </button>
                          
                          <button 
                             onClick={handleRedeem}
                             disabled={redemptionInput !== '我找回了我的原则'}
                             className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs tracking-wider border ${
                                 redemptionInput === '我找回了我的原则' 
                                 ? 'bg-white text-black border-white hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                 : 'bg-white/5 text-white/20 border-transparent cursor-not-allowed'
                             }`}
                          >
                              <RefreshCw size={14} /> 重铸原则 (Reset)
                          </button>
                      </div>
                      <button 
                        onClick={() => setRedemptionTarget(null)}
                        className="w-full py-2 text-white/20 text-xs hover:text-white/40"
                      >
                          取消
                      </button>
                  </div>
              </div>
          </div>
      )}

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
        {displayedItems.map(item => {
          const breakCount = item.breaks?.length || 0;
          
          // Determine styles based on context
          let styles = {
              container: 'bg-white border-white/10 hover:shadow-lg',
              text: 'text-gray-800',
              icon: null as any,
              iconColor: '',
              label: '',
              labelClass: '',
              btnText: '',
              buttonClass: ''
          };
          
          if (type === 'NOT_TO_DO') {
              styles = getItemStyles(breakCount);
          } else {
              // Standard styles for other lists
              if (item.category === 'sentence') styles.icon = Quote;
              if (item.category === 'book') styles.icon = Book;
              if (item.category === 'article') styles.icon = PenTool;
              styles.iconColor = 'text-[#8E5E73]/40';
          }
          
          const StatusIcon = styles.icon;

          return (
            <div 
              key={item.id} 
              className={`group rounded-2xl shadow-sm border overflow-hidden transition-all duration-500 ${styles.container} ${item.category === 'article' ? 'cursor-pointer' : ''} ${breakCount >= 6 ? 'glitch-hover' : ''}`}
              onClick={() => item.category === 'article' && toggleExpand(item.id)}
            >
              <div className="p-6 flex justify-between items-start relative z-10">
                  <div className="space-y-3 w-full">
                      <div className="flex items-start gap-4">
                          
                          {/* Left Icon: Changes based on severity or type */}
                          {StatusIcon && <StatusIcon size={20} className={`${styles.iconColor} mt-1 flex-shrink-0 transition-colors`} />}
                          
                          <div className="flex-1">
                                  <p className={`text-lg leading-relaxed transition-colors ${styles.text} ${item.category === 'sentence' ? 'italic font-serif text-gray-600' : ''}`}>
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
                          
                          {/* Break Button / Counter for Not-To-Do List */}
                          {type === 'NOT_TO_DO' && (
                              <div className="flex flex-col items-end gap-2">
                                  {breakCount > 0 && (
                                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${styles.labelClass}`}>
                                          {breakCount >= 6 ? 'VOID' : `${breakCount} Breaks`}
                                      </span>
                                  )}
                                  
                                  <button 
                                    onClick={(e) => recordBreak(item.id, e)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${styles.buttonClass}`}
                                    title={breakCount >= 6 ? "重铸原则或记录沉沦" : "记录破戒 (Record Break)"}
                                  >
                                      {breakCount >= 6 ? <Skull size={14}/> : <Zap size={14} className={breakCount > 0 ? "fill-current" : ""}/>}
                                      <span>{styles.btnText || '破戒'}</span>
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      <div className="flex items-center justify-between pl-9 pr-1">
                        <div className={`flex items-center gap-2 text-xs opacity-50 font-medium ${breakCount >= 6 ? 'text-red-500/50' : 'text-gray-400'}`}>
                             <Calendar size={12} />
                             <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>

                        <button 
                            onClick={(e) => remove(item.id, e)}
                            className={`transition-all p-1 opacity-0 group-hover:opacity-100 ${breakCount >= 6 ? 'text-red-500 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                            title="删除"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
              </div>
              
              {/* Optional Decoration for Void Level */}
              {breakCount >= 6 && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[50px] pointer-events-none"></div>
              )}
              
              {item.category === 'article' && expandedItems[item.id] && item.content && (
                  <div className="px-6 pb-6 pt-0 animate-fade-in cursor-text" onClick={e => e.stopPropagation()}>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-serif border-l-4 border-[#8E5E73]/30 ml-9">
                          {item.content}
                      </div>
                  </div>
              )}
            </div>
          );
        })}
        
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
