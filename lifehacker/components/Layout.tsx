
import React, { useState } from 'react';
import { PageView } from '../types';
import { Navigation } from './Navigation';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  isDreamMode: boolean;
  onTriggerTutorial: () => void; // New prop
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onNavigate, isDreamMode, onTriggerTutorial, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If in "Dream Mode" (Gatekeeper), we render full screen without layout shell
  if (isDreamMode) {
    return <div className="h-screen w-screen bg-black overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#8E5E73] overflow-hidden text-white font-sans selection:bg-white selection:text-[#8E5E73]">
      {/* Desktop Sidebar */}
      <Navigation 
        current={currentPage} 
        onChange={onNavigate} 
        onTriggerTutorial={onTriggerTutorial}
        className="w-64 h-full hidden md:flex" 
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center justify-between sticky top-0 z-30 bg-[#8E5E73]/90 backdrop-blur-md border-b border-white/10">
             <h1 className="text-lg font-bold text-white tracking-tight">生活黑客</h1>
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 active:scale-95 transition-transform">
                 <Menu size={24} />
             </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-[#8E5E73] flex flex-col animate-fade-in md:hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <span className="font-bold text-lg">导航</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/70 hover:text-white">
                        <X size={24}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <Navigation 
                        current={currentPage} 
                        onChange={(page) => {
                            onNavigate(page);
                            setIsMobileMenuOpen(false);
                        }} 
                        onTriggerTutorial={() => {
                            onTriggerTutorial();
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full h-auto border-none bg-transparent static p-0"
                    />
                </div>
            </div>
        )}

        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full min-h-full pb-24 md:pb-12">
            {children}
        </div>
      </main>
    </div>
  );
};
