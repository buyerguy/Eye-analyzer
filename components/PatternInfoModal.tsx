
import React from 'react';
import { IconX, IconFingerprint } from './IconComponents';

interface PatternInfoModalProps {
  pattern: {
    name: string;
    description: string;
  };
  onClose: () => void;
}

const PatternInfoModal: React.FC<PatternInfoModalProps> = ({ pattern, onClose }) => {
  if (!pattern) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative border border-white/20 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close pattern info"
        >
          <IconX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-teal mb-4 flex items-center gap-3">
            <IconFingerprint className="w-7 h-7" />
            {pattern.name}
        </h2>
        <p className="text-gray-300">
          {pattern.description}
        </p>
      </div>
    </div>
  );
};

export default PatternInfoModal;
