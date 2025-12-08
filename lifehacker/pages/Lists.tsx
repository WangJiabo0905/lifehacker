import React, { useEffect, useState } from 'react';
import { ListItem } from '../types';
import { StorageService } from '../services/storageService';
import { Trash2, Plus, Calendar, BookOpen, Quote, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

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
  
  // For Inspiration
  const [inspCategory, setInspCategory] = useState<'sentence' | 'book' | 'article'>('sentence');
  const [author, setAuthor] = useState('');
  const [articleContent, setArticleContent] = useState(''); // New state for article body

  // For UI state
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const config = CONFIG[type];

  useEffect(() => {
    setItems(StorageService.getList(type));
  }, [type]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    const item: ListItem = {
      id: Date.now().toString(),
      text: newItem, // Title for books/articles, Text for sentences
      createdAt: new Date().toISOString(),
      category: type === 'INSPIRATION' ? inspCategory : undefined,
      author: (type === 'INSPIRATION' && (inspCategory === 'book' || inspCategory === 'article')) ? author : undefined,
      content: (type === 'INSPIRATION' && inspCategory === 'article') ? articleContent : undefined
    };

    StorageService.saveListItem(type, item);
    setItems(prev => [item, ...prev]); 
    setNewItem('');
    setAuthor('');
    setArticleContent('');
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteListItem(type, id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({...prev, [id]: !prev[id]}));
  };

  const getIcon = (cat?: string) => {
      if(cat === 'book') return <BookOpen size={16} className="text-[#8E5E73]" />;
      if(cat === 'article') return <FileText size={16} className="text-blue-500" />;
      return <Quote size={16} className="text-orange-500" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="text-center space-y-4 py-8">
        <h2 className={`text-4xl font-bold tracking-tight ${config.color} flex items-center justify-center gap-3`}>
            {type === 'INSPIRATION' && <Sparkles size={32}/>}
            {config.title}
        </h2>
        <p className="text-white/70 text-lg font-light">{config.desc}</p>
      </header>

      <form onSubmit={add} className="bg-white rounded-3xl p-2 shadow-lg shadow-black/10">
        
        {/* Category Selector for Inspiration */}
        {config.showCategory && (
            <div className="flex gap-2 p-2 border-b border-gray-100 mb-2">
                <button 
                  type="button" 
                  onClick={() => setInspCategory('sentence')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${inspCategory === 'sentence' ? 'bg-orange-100 text-orange-700' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <Quote size={14}/> 句子
                </button>
                <button 
                  type="button" 
                  onClick={() => setInspCategory('book')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${inspCategory === 'book' ? 'bg-[#8E5E73]/20 text-[#8E5E73]' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <BookOpen size={14}/> 书籍
                </button>
                <button 
                  type="button" 
                  onClick={() => setInspCategory('article')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${inspCategory === 'article' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <FileText size={14}/> 文章
                </button>
            </div>
        )}

        <div className="flex flex-col gap-2 p-2">
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={
                    type === 'INSPIRATION' 
                        ? (inspCategory === 'book' ? "输入书名..." : inspCategory === 'article' ? "输入文章标题..." : "输入那个击中你的句子...") 
                        : config.placeholder
                }
                className="flex-1 bg-transparent text-lg p-4 outline-none text-gray-800 placeholder:text-gray-300"
              />
              
              {(type === 'INSPIRATION' && (inspCategory === 'book' || inspCategory === 'article')) && (
                  <input 
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="作者 (可选)"
                      className="w-full md:w-32 bg-gray-50 rounded-xl px-4 py-2 md:py-0 outline-none text-sm text-gray-700"
                  />
              )}

              <button 
                type="submit" 
                className="bg-[#8E5E73] text-white rounded-xl aspect-square w-full md:w-14 h-14 md:h-auto flex items-center justify-center hover:scale-95 transition-transform shadow-md"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Article Content Textarea */}
            {(type === 'INSPIRATION' && inspCategory === 'article') && (
               <textarea
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="在此处粘贴文章的段落或完整内容..."
                  className="w-full bg-gray-50 rounded-xl p-4 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-100 min-h-[100px] resize-y"
               />
            )}
        </div>
      </form>

      <div className="space-y-4">
        {items.map(item => (
          <div 
            key={item.id} 
            className={`group bg-white rounded-2xl shadow-sm border border-white/10 overflow-hidden transition-all hover:shadow-lg ${item.category === 'article' ? 'cursor-pointer' : ''}`}
            onClick={() => item.category === 'article' && toggleExpand(item.id)}
          >
            <div className="p-6 flex justify-between items-start">
                <div className="space-y-3 w-full">
                    <div className="flex items-start gap-3">
                        {type === 'INSPIRATION' && (
                            <div className="mt-1 opacity-70 flex-shrink-0">
                                {getIcon(item.category)}
                            </div>
                        )}
                        <div className="flex-1">
                                <p className={`text-lg text-gray-800 leading-relaxed font-medium ${item.category === 'sentence' ? 'italic font-serif text-gray-600' : ''}`}>
                                    {item.category === 'sentence' && <span className="text-4xl text-gray-200 font-serif absolute -translate-x-6 -translate-y-4">“</span>}
                                    {item.text}
                                </p>
                                {item.author && (
                                    <p className="text-sm text-gray-500 mt-1">—— {item.author}</p>
                                )}
                        </div>
                        
                        {/* Expand/Collapse Indicator for Articles */}
                        {item.category === 'article' && (
                            <div className="text-gray-300">
                                {expandedItems[item.id] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-300 font-medium pl-1">
                        <Calendar size={12} />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.category && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-400 capitalize">{item.category}</span>}
                    </div>
                </div>
                
                <button 
                onClick={(e) => remove(item.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-2 flex-shrink-0 ml-2"
                >
                <Trash2 size={18} />
                </button>
            </div>
            
            {/* Expanded Content for Articles */}
            {item.category === 'article' && expandedItems[item.id] && item.content && (
                <div className="px-6 pb-6 pt-0 animate-fade-in">
                    <div className="bg-blue-50/50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-serif border-l-4 border-blue-200">
                        {item.content}
                    </div>
                </div>
            )}
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center text-white/40 py-12 flex flex-col items-center gap-4">
            <Sparkles size={48} className="opacity-50"/>
            <p>暂无记录。开始捕捉你的灵感碎片吧。</p>
          </div>
        )}
      </div>
    </div>
  );
};