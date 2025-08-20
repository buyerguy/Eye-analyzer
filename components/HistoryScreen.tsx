
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { IconArrowLeft, IconTrash, IconSearch } from './IconComponents';

interface HistoryItemCardProps {
  item: HistoryItem;
  onView: () => void;
  onDelete: () => void;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item, onView, onDelete }) => {
    const { analysis, imageSrc, date } = item;
    const uniquenessScore = 100 - analysis.rarityIndex.percentage;

    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 flex gap-4 items-start transition-all hover:bg-gray-800/80">
            <img 
                src={imageSrc} 
                alt="Analyzed eye thumbnail" 
                className="w-20 h-20 rounded-full object-cover cursor-pointer flex-shrink-0 border-2 border-white/20"
                onClick={onView}
            />
            <div className="flex-grow cursor-pointer" onClick={onView}>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: analysis.dominantColor.hexCode }}></span>
                    <h3 className="font-bold text-white text-lg">{analysis.dominantColor.name} {analysis.dominantColor.confidence}%</h3>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    <span className="font-semibold text-gray-300">Uniqueness:</span> {uniquenessScore}/100 
                    <span className="mx-2">|</span>
                    <span className="font-semibold text-gray-300">Prevalence:</span> {analysis.rarityIndex.percentage}%
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    {analysis.colorComposition.slice(0, 4).map((comp, index) => (
                        <div key={index} className="flex items-center gap-1" title={`${comp.colorName} ${comp.percentage}%`}>
                            <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: comp.hexCode }}></span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{new Date(date).toLocaleString()}</p>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if(window.confirm('Are you sure you want to delete this scan?')) {
                  onDelete();
                }
              }} 
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Delete scan"
            >
                <IconTrash className="w-5 h-5"/>
            </button>
        </div>
    );
};


interface HistoryScreenProps {
  history: HistoryItem[];
  onViewItem: (item: HistoryItem) => void;
  onDeleteItem: (id: number) => void;
  onClearAll: () => void;
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onViewItem, onDeleteItem, onClearAll, onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredHistory = useMemo(() => {
        if (!searchQuery) return history;
        return history.filter(item => {
            const searchTerm = searchQuery.toLowerCase();
            const { analysis } = item;
            return (
                analysis.dominantColor.name.toLowerCase().includes(searchTerm) ||
                analysis.ancestry.title.toLowerCase().includes(searchTerm) ||
                analysis.personalityVibe.title.toLowerCase().includes(searchTerm) ||
                new Date(item.date).toLocaleDateString().toLowerCase().includes(searchTerm)
            );
        });
    }, [history, searchQuery]);

    return (
        <div className="animate-fade-in w-full max-w-3xl mx-auto">
            <header className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white" aria-label="Go back">
                    <IconArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-white">History</h1>
                <button 
                  onClick={onClearAll} 
                  className={`p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors ${history.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Clear all history"
                  disabled={history.length === 0}
                >
                    <IconTrash className="w-6 h-6" />
                </button>
            </header>
            
            <div className="relative mb-6">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Search by color, insight, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/60 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
            </div>

            {filteredHistory.length > 0 ? (
                <div className="space-y-4">
                    {filteredHistory.map(item => (
                        <HistoryItemCard 
                            key={item.id} 
                            item={item} 
                            onView={() => onViewItem(item)}
                            onDelete={() => onDeleteItem(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-400 text-lg">
                        {searchQuery ? 'No scans match your search.' : 'No scans yet—try your first analysis!'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default HistoryScreen;
