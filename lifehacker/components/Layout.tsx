import React from 'react';
import { Navigation } from './Navigation';
import { PageView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  isDreamMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, isDreamMode }) => {
  if (isDreamMode) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  return (
    <div className="flex min-h-screen font-sans">
      <Navigation current={currentPage} onChange={onNavigate} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-5xl mx-auto h-full">
            {children}
        </div>
      </main>
      
      {/* Mobile Nav Overlay */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#8E5E73]/90 backdrop-blur-md border-t border-white/10 p-4 flex justify-around z-50 shadow-2xl">
        <button onClick={() => onNavigate('dreams_view')} className="text-xs font-medium text-white/80 hover:text-white">Dreams</button>
        <button onClick={() => onNavigate('plan')} className="text-xs font-medium text-white/80 hover:text-white">Plan</button>
        <button onClick={() => onNavigate('work')} className="text-xs font-medium text-white/80 hover:text-white">Track</button>
      </div>
    </div>
  );
};