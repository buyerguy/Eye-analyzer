
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { IconSun, IconMoon } from './IconComponents';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-brand-purple transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <IconMoon className="w-6 h-6" />
      ) : (
        <IconSun className="w-6 h-6" />
      )}
    </button>
  );
};

export default ThemeToggle;
