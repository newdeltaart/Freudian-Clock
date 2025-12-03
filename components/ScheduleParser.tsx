import React, { useState } from 'react';
import { parseScheduleFromText } from '../services/geminiService';
import { ScheduleItem, ParsingStatus } from '../types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ScheduleParserProps {
  onScheduleParsed: (schedule: ScheduleItem[]) => void;
}

export const ScheduleParser: React.FC<ScheduleParserProps> = ({ onScheduleParsed }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ParsingStatus>(ParsingStatus.IDLE);

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setStatus(ParsingStatus.PARSING);
    try {
      const schedule = await parseScheduleFromText(input);
      onScheduleParsed(schedule);
      setStatus(ParsingStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(ParsingStatus.ERROR);
    }
  };

  const handleSample = () => {
    const sample = `09:00 - Registration & Coffee
09:30 - Opening Remarks: The State of AI in Archives
10:00 - Keynote: Digital Restoration in the 21st Century
11:00 - Coffee Break
11:30 - Workshop: Prompt Engineering for Librarians
12:30 - Lunch Break
13:30 - Panel: Ethics of Generative Models in Museums
15:00 - Closing Thoughts`;
    setInput(sample);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 max-w-2xl mx-auto w-full animate-fadeIn">
      <h1 className="text-4xl md:text-5xl mb-6 text-[#2b211e] font-display text-center leading-tight">
        The Curator's<br/>Chronometer
      </h1>
      
      <p className="mb-8 text-[#5c4b40] text-center font-serif italic text-lg">
        "Paste your timeline. Let the machine observe the passage of time."
      </p>

      <div className="w-full relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="09:00 Registration..."
          className="w-full h-64 bg-[#e3dac9] border-2 border-[#bfa596] p-6 text-[#2b211e] placeholder-[#8c7b70] focus:outline-none focus:border-[#2b211e] transition-colors resize-none shadow-inner font-mono text-sm rounded-sm"
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
           <button 
            onClick={handleSample}
            className="text-xs text-[#8c7b70] underline hover:text-[#2b211e] px-3 py-1"
          >
            Load Sample
          </button>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleParse}
          disabled={status === ParsingStatus.PARSING || !input.trim()}
          className={`
            relative overflow-hidden group px-8 py-3 bg-[#2b211e] text-[#e3dac9] font-bold tracking-widest uppercase text-sm
            transition-all duration-300 hover:bg-[#4a3b32] disabled:opacity-50 disabled:cursor-not-allowed
            shadow-[4px_4px_0px_0px_rgba(140,63,63,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(140,63,63,1)]
          `}
        >
          <span className="flex items-center gap-2">
            {status === ParsingStatus.PARSING ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Interpreting...
              </>
            ) : (
              <>
                Initialize Sequence
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </button>
      </div>

      {status === ParsingStatus.ERROR && (
        <p className="mt-4 text-[#8c3f3f] font-bold">The text was too abstract. Try a clearer format.</p>
      )}
    </div>
  );
};
