
import React from 'react';
import { IconX, IconSettings } from './IconComponents';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const handleManageSubscription = () => {
    window.open('https://play.google.com/store/account/subscriptions', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative border border-white/20 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close settings"
        >
          <IconX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-teal mb-6 flex items-center gap-3">
          <IconSettings className="w-7 h-7" />
          Settings
        </h2>
        <div className="space-y-4">
          <button
            onClick={handleManageSubscription}
            className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Manage Subscription
          </button>
          <a
            href="mailto:savemoresuppliers@gmail.com"
            className="block w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
