
import React from 'react';

interface AnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 h-full flex flex-col">
        <div className="flex items-center gap-4">
            <div className="text-brand-teal">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 mt-3 text-base flex-grow">{description}</p>
    </div>
  );
};

export default AnalysisCard;
