
import React from 'react';
import { AppState } from '../types';
import { IconHome, IconHistory, IconSettings } from './IconComponents';

interface BottomNavBarProps {
  activeState: AppState;
  onHome: () => void;
  onHistory: () => void;
  onSettings: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  const activeClasses = 'text-brand-purple';
  const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-colors duration-200 w-20 py-1 rounded-full ${isActive ? '' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
      aria-label={label}
    >
      <div className={isActive ? activeClasses : inactiveClasses}>
          {icon}
      </div>
      <span className={`text-xs font-medium ${isActive ? activeClasses : inactiveClasses}`}>
        {label}
      </span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeState, onHome, onHistory, onSettings }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-4 animate-slide-in-up">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg rounded-full border border-gray-200 dark:border-white/20 flex items-center justify-around px-2 py-1.5 space-x-2">
        <NavItem
          icon={<IconHome className="w-6 h-6" />}
          label="Home"
          isActive={activeState === AppState.IDLE || activeState === AppState.SUCCESS || activeState === AppState.ERROR}
          onClick={onHome}
        />
        <NavItem
          icon={<IconHistory className="w-6 h-6" />}
          label="History"
          isActive={activeState === AppState.HISTORY}
          onClick={onHistory}
        />
        <NavItem
          icon={<IconSettings className="w-6 h-6" />}
          label="Settings"
          isActive={false} // Settings is a modal, not a persistent state
          onClick={onSettings}
        />
      </div>
    </nav>
  );
};

export default BottomNavBar;
