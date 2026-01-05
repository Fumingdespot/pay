import React from 'react';
import { ViewState } from '../types';
import { Icons } from './Icon';

interface NavBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
      currentView === view ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-gray-200 flex items-center justify-around z-50 pb-safe">
      <button className={navItemClass('dashboard')} onClick={() => setView('dashboard')}>
        <Icons.Home size={24} />
        <span className="text-[10px] font-medium">明细</span>
      </button>
      
      <div className="relative -top-5">
        <button 
          onClick={() => setView('add')}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-transform"
        >
          <Icons.Plus size={28} />
        </button>
      </div>

      <button className={navItemClass('analytics')} onClick={() => setView('analytics')}>
        <Icons.PieChart size={24} />
        <span className="text-[10px] font-medium">统计</span>
      </button>
    </div>
  );
};
