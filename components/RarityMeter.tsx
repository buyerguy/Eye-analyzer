
import React from 'react';

interface RarityMeterProps {
  title: string;
  description: string;
  percentage: number;
  icon: React.ReactNode;
}

const RarityMeter: React.FC<RarityMeterProps> = ({ title, description, percentage, icon }) => {
  const commonness = 100 - percentage;

  return (
    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <div className="text-brand-pink">{icon}</div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-300 mt-3 text-base mb-4">{description}</p>
      <div className="w-full mt-auto">
        <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-1">
          <span>Rare</span>
          <span>Common</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-white/20">
          <div
            className="bg-gradient-to-r from-brand-pink to-brand-purple h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${commonness}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 font-bold text-lg text-white">{`${100-percentage}% Rarity` }</div>
      </div>
    </div>
  );
};

export default RarityMeter;
