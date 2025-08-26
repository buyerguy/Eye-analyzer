
import React from 'react';
import { IconX, IconSparkles, IconDna, IconShield, IconMoon } from './IconComponents';

interface PaywallModalProps {
  onUpgrade: () => void;
  onClose: () => void;
  scanCount: number;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onUpgrade, onClose, scanCount }) => {
  const premiumFeatures = [
    { 
      icon: <IconSparkles className="w-6 h-6 text-brand-purple" />,
      text: "Unlimited eye color & pattern analysis"
    },
    { 
      icon: <IconDna className="w-6 h-6 text-brand-purple" />,
      text: "In-depth eye analysis reports with expert insights"
    },
    { 
      icon: <IconShield className="w-6 h-6 text-brand-purple" />,
      text: "Ad-free experience for seamless exploration"
    },
    { 
      icon: <IconMoon className="w-6 h-6 text-brand-purple" />,
      text: "Sleek Dark Mode for comfortable nighttime use"
    }
  ];
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">Unlock Unlimited Eye Analysis!</h2>
            
            <p className="text-center mt-2 text-sm text-red-600 font-semibold bg-red-100 rounded-full py-1">
                You’ve used your {scanCount} free scans this week!
            </p>
            
            <p className="mt-4 text-center text-gray-600 dark:text-gray-300 text-base">
                You’ve discovered the magic of iris analysis—why stop now? Upgrade to Premium for unlimited scans, in-depth AI insights, an ad-free experience, and sleek Dark Mode! You’re one step away from exploring your eyes without limits.
            </p>
            
            <ul className="mt-6 space-y-4">
                {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-4">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                            {feature.icon}
                        </div>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{feature.text}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6 text-center bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <p className="text-lg font-bold text-gray-800 dark:text-white">Only <span className="text-indigo-600 text-2xl">$2 per week</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Subscription renews automatically unless auto-renewal is turned off at least 24-hours before the end of the period. Your account will be charged for renewal within 24-hours prior to the end of the period at the rate of your selected plan.
                </p>
            </div>
            
            <button
                onClick={onUpgrade}
                className="w-full mt-6 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
                Upgrade Now
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                You can manage or cancel your subscription in your Account Settings after purchase.
            </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 px-8 py-3 border-t border-gray-200 dark:border-white/10">
            <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                Payment will be charged to your iTunes Account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24-hours before the end of the period. All purchases subject to Terms of Use and Privacy Policy.
            </p>
        </div>

        <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-700 rounded-full p-1"
            aria-label="Close"
        >
            <IconX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PaywallModal;
