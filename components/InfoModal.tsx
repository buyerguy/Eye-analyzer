
import React from 'react';
import { IconX } from './IconComponents';

interface InfoModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ title, message, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative border border-gray-200 dark:border-white/20 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <IconX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-teal mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
          {message}
        </p>
      </div>
    </div>
  );
};

export default InfoModal;
