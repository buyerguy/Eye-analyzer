import React from 'react';
import { IconX, IconCamera } from './IconComponents';

interface ShotTipsModalProps {
  onClose: () => void;
}

const ShotTipsModal: React.FC<ShotTipsModalProps> = ({ onClose }) => {
  const tips = [
    "Place your eye close to the camera",
    "Align your iris within the circle",
    "Use good lighting—bright but not harsh",
    "Remove glasses or contact lenses if possible",
    "Look straight at the camera and keep your eye open wide",
    "Avoid blurry or out-of-focus shots",
    "Keep the background simple"
  ];

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
          aria-label="Close shot tips"
        >
          <IconX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-teal mb-4 flex items-center gap-3">
            <IconCamera className="w-7 h-7" />
            Shot Tips
        </h2>
        <ul className="space-y-3 list-disc list-inside text-gray-300">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShotTipsModal;