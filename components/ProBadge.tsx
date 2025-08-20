import React from 'react';
import { IconPro } from './IconComponents';

const ProBadge: React.FC = () => {
  return (
    <div 
      className="absolute top-4 right-4 bg-yellow-400 text-gray-900 rounded-full px-3 py-1 flex items-center gap-1 text-xs font-bold shadow-lg animate-fade-in"
      aria-label="Premium user"
    >
      <IconPro className="w-4 h-4" />
      <span>PRO</span>
    </div>
  );
};

export default ProBadge;
