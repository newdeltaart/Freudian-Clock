import React from 'react';
import { ScheduleItem } from '../types';
import { Clock, Coffee, Mic, Users, Wrench, PlayCircle } from 'lucide-react';

interface TimelineProps {
  items: ScheduleItem[];
  activeItemId: string | null;
  onEdit: () => void;
  onItemClick?: (item: ScheduleItem) => void;
}

const getIcon = (type: ScheduleItem['type']) => {
  switch (type) {
    case 'break': return <Coffee className="w-4 h-4" />;
    case 'workshop': return <Wrench className="w-4 h-4" />;
    case 'panel': return <Users className="w-4 h-4" />;
    case 'presentation': 
    default: return <Mic className="w-4 h-4" />;
  }
};

export const Timeline: React.FC<TimelineProps> = ({ items, activeItemId, onEdit, onItemClick }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-md bg-[#e3dac9] border-r-2 border-[#bfa596] h-full overflow-y-auto p-6 shadow-inner relative">
       <div className="flex justify-between items-center mb-8 border-b border-[#2b211e] pb-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#2b211e]">Schedule</h2>
        <button 
          onClick={onEdit}
          className="text-xs uppercase tracking-wider underline hover:text-[#8c3f3f] transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {items.map((item, idx) => {
          const isActive = item.id === activeItemId;
          return (
            <div 
              key={item.id} 
              onClick={() => onItemClick && onItemClick(item)}
              className={`relative pl-6 border-l-2 transition-all duration-300 group ${
                isActive 
                  ? 'border-[#8c3f3f] opacity-100 scale-105 origin-left' 
                  : 'border-[#bfa596] opacity-60 hover:opacity-100 cursor-pointer hover:border-[#5c4b40] hover:pl-7'
              }`}
            >
              {/* Timeline dot */}
              <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full transition-colors ${
                isActive ? 'bg-[#8c3f3f]' : 'bg-[#bfa596] group-hover:bg-[#5c4b40]'
              }`} />

              <div className="flex items-center gap-2 text-xs font-serif italic text-[#5c4b40] mb-1">
                <span className="font-bold">{item.startTime}</span>
                {item.endTime && <span>- {item.endTime}</span>}
              </div>

              <h3 className={`font-display text-lg leading-tight mb-1 transition-colors ${
                isActive ? 'text-[#2b211e]' : 'text-[#5c4b40] group-hover:text-[#2b211e]'
              }`}>
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#8c7b70]">
                  {getIcon(item.type)}
                  <span>{item.type}</span>
                </div>
                
                {/* Hover Play Indicator for non-active items */}
                {!isActive && (
                  <PlayCircle className="w-4 h-4 text-[#8c3f3f] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xs italic text-[#8c7b70] font-serif">
          "Time is a painter that never stops."
        </p>
      </div>
    </div>
  );
};