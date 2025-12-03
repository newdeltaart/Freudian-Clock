import React, { useState, useEffect, useCallback } from 'react';
import { ScheduleItem, TimerState } from './types';
import { ScheduleParser } from './components/ScheduleParser';
import { Timeline } from './components/Timeline';
import { FreudEgg } from './components/FreudEgg';
import { Play, Pause, SkipForward, RotateCcw, FastForward, Rewind, Clock, AlertCircle } from 'lucide-react';

// Helper to convert HH:MM string to a Date object for *today*
const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper to format ms to MM:SS
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  
  const [debugOffset, setDebugOffset] = useState(0);
  const [now, setNow] = useState(new Date());
  
  // Timer State
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [nextItem, setNextItem] = useState<ScheduleItem | null>(null);

  // Update clock every second, accounting for debug offset
  useEffect(() => {
    const updateTime = () => {
      setNow(new Date(Date.now() + debugOffset));
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [debugOffset]);

  const adjustTime = (minutes: number) => {
    setDebugOffset(prev => prev + minutes * 60 * 1000);
  };
  
  const resetDebugTime = () => {
    setDebugOffset(0);
  };

  // Jump to specific item start time
  const handleTimelineItemClick = (item: ScheduleItem) => {
    const startTime = parseTime(item.startTime);
    const nowReal = Date.now();
    // Calculate offset needed to make "simulated now" equal to "item start time"
    // nowSimulated = nowReal + offset
    // startTime = nowReal + offset
    // offset = startTime - nowReal
    setDebugOffset(startTime.getTime() - nowReal);
  };

  // Sound Effect Logic
  const playSoothingSound = useCallback(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    // Create a gentle bell/chime sound using additive synthesis
    const createChime = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, startTime);
      // Subtle pitch drift for organic feel
      osc.frequency.linearRampToValueAtTime(freq * 0.99, startTime + duration);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05); // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Long tail
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // E major chord for soothing resolution
    createChime(329.63, t, 4, 0.2); // E4
    createChime(415.30, t + 0.1, 3.5, 0.15); // G#4
    createChime(493.88, t + 0.2, 3, 0.15); // B4
    
  }, []);

  // Determine active segment based on current time and schedule
  const determineActiveSegment = useCallback(() => {
    if (!schedule.length) return;

    // Sort schedule just in case
    const sorted = [...schedule].sort((a, b) => parseTime(a.startTime).getTime() - parseTime(b.startTime).getTime());
    
    // Find current item
    const current = sorted.find(item => {
      const start = parseTime(item.startTime);
      // If end time exists, use it. If not, use next item's start.
      const nextItemIndex = sorted.indexOf(item) + 1;
      const end = item.endTime 
        ? parseTime(item.endTime) 
        : (nextItemIndex < sorted.length ? parseTime(sorted[nextItemIndex].startTime) : new Date(start.getTime() + 60 * 60 * 1000)); // Default 1h
      
      return now >= start && now < end;
    });

    // Find next item
    const next = sorted.find(item => parseTime(item.startTime) > now);
    
    setActiveItem(current || null);
    setNextItem(next || null);

  }, [schedule, now]);

  useEffect(() => {
    determineActiveSegment();
  }, [determineActiveSegment]);


  const calculateProgress = (): { progress: number, timeLeft: number, isOvertime: boolean, totalDuration: number } => {
    if (!activeItem) return { progress: 0, timeLeft: 0, isOvertime: false, totalDuration: 1 };

    const start = parseTime(activeItem.startTime).getTime();
    let end = activeItem.endTime ? parseTime(activeItem.endTime).getTime() : 0;
    
    if (!end) {
       // Infer end from next item
       const idx = schedule.indexOf(activeItem);
       if (idx < schedule.length - 1) {
         end = parseTime(schedule[idx + 1].startTime).getTime();
       } else {
         end = start + 60 * 60 * 1000; // 60 min default for last item
       }
    }

    const totalDuration = end - start;
    const elapsed = now.getTime() - start;
    
    // Progress for the visual: 0 (start) -> 1 (end)
    const rawProgress = elapsed / totalDuration;
    
    // Time Left calculation
    const timeLeft = end - now.getTime();
    
    if (timeLeft < 0) {
      // Overtime
      return {
        progress: 1, // Full egg
        timeLeft: timeLeft, // Negative value
        isOvertime: true,
        totalDuration
      };
    }

    return {
      progress: rawProgress,
      timeLeft: timeLeft,
      isOvertime: false,
      totalDuration
    };
  };

  const { progress, timeLeft, isOvertime, totalDuration } = calculateProgress();

  // Trigger sound effect on overtime transition
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  useEffect(() => {
    if (isOvertime && !hasPlayedSound) {
      playSoothingSound();
      setHasPlayedSound(true);
    } else if (!isOvertime) {
      setHasPlayedSound(false);
    }
  }, [isOvertime, hasPlayedSound, playSoothingSound]);

  // Jump to break logic for debug
  const jumpToBreak = () => {
    if (!activeItem) return;
    const start = parseTime(activeItem.startTime).getTime();
    let end = activeItem.endTime ? parseTime(activeItem.endTime).getTime() : 0;
    if (!end) {
      const idx = schedule.indexOf(activeItem);
      if (idx < schedule.length - 1) {
        end = parseTime(schedule[idx + 1].startTime).getTime();
      } else {
        end = start + 60 * 60 * 1000;
      }
    }
    // Set time to 5 seconds before end
    const targetTime = end - 5000;
    const currentRealTime = Date.now();
    setDebugOffset(targetTime - currentRealTime);
  };

  if (!hasParsed) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#dcd0c0]">
        <ScheduleParser onScheduleParsed={(s) => { setSchedule(s); setHasParsed(true); }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#dcd0c0] text-[#2b211e]">
      {/* Sidebar Timeline */}
      <div className="hidden md:block md:w-1/3 lg:w-1/4 h-full z-10">
        <Timeline 
          items={schedule} 
          activeItemId={activeItem?.id || null} 
          onEdit={() => setHasParsed(false)}
          onItemClick={handleTimelineItemClick}
        />
      </div>

      {/* Main Timer Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        
        {/* Current Time Display (Small) */}
        <div className="absolute top-8 right-8 flex flex-col items-end">
          <div className="font-serif italic text-[#8c7b70] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Local Time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {debugOffset !== 0 && (
             <div className="text-xs text-[#8c3f3f] font-mono mt-1">
               (Simulated: {debugOffset > 0 ? '+' : ''}{Math.round(debugOffset/60000)}m)
             </div>
          )}
        </div>

        <div className="flex flex-col items-center max-w-2xl w-full">
          
          {/* Status Text */}
          <div className="mb-8 text-center space-y-2">
            {!activeItem && nextItem && (
               <h3 className="text-[#5c4b40] font-serif italic text-xl">Up Next</h3>
            )}
            {activeItem && (
               <h3 className="text-[#8c3f3f] font-serif italic text-xl tracking-widest uppercase animate-pulse">
                 {isOvertime ? 'Overtime' : 'Now Presenting'}
               </h3>
            )}
            
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight text-[#2b211e] mb-2 text-center">
              {activeItem ? activeItem.title : (nextItem ? "Break / Transition" : "End of Day")}
            </h1>
            
            {activeItem?.description && (
              <p className="text-[#5c4b40] max-w-lg mx-auto font-serif">{activeItem.description}</p>
            )}
          </div>

          {/* The Freud Egg Timer */}
          <div className="mb-10 scale-110">
            <FreudEgg progress={progress} isOvertime={isOvertime} />
          </div>

          {/* Digital Timer Overlay */}
          <div className={`text-6xl md:text-8xl font-display font-bold tabular-nums tracking-tighter ${isOvertime ? 'text-[#8c3f3f] animate-pulse' : 'text-[#2b211e]'}`}>
            {isOvertime ? '+' : ''}{formatTime(timeLeft)}
          </div>
          
          <div className="text-sm uppercase tracking-widest text-[#8c7b70] mt-2">
             {isOvertime ? 'Past Schedule' : 'Remaining'}
          </div>

          {/* Controls */}
           <div className="mt-12 flex flex-col items-center gap-6">
              
              <div className="flex gap-4">
                {/* Reset / Re-parse */}
                <button 
                  onClick={() => setHasParsed(false)}
                  className="group flex items-center gap-2 px-6 py-2 rounded-full border border-[#bfa596] text-[#5c4b40] hover:bg-[#bfa596] hover:text-[#e3dac9] transition-all"
                  title="Edit Schedule"
                >
                  <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                  <span className="text-xs uppercase tracking-widest">New Schedule</span>
                </button>
              </div>

              {/* Debug / Time Travel Controls */}
              <div className="flex flex-wrap justify-center items-center gap-2 p-2 rounded-xl bg-[#5c4b40]/5 border border-[#5c4b40]/10">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c7b70] px-2 w-full text-center sm:w-auto">
                   Time Machine
                 </span>
                 
                 <button 
                  onClick={() => adjustTime(-5)}
                  className="p-2 hover:bg-[#8c3f3f]/10 text-[#5c4b40] rounded-lg transition-colors"
                  title="Rewind 5m"
                 >
                   <Rewind className="w-4 h-4" />
                 </button>

                 <div className="flex gap-1">
                   <button 
                    onClick={() => adjustTime(1)}
                    className="px-3 py-1 text-xs font-mono font-bold text-[#5c4b40] bg-[#e3dac9] rounded shadow-sm hover:bg-[#fff] transition-colors"
                   >
                     +1m
                   </button>
                   <button 
                    onClick={() => adjustTime(15)}
                    className="px-3 py-1 text-xs font-mono font-bold text-[#5c4b40] bg-[#e3dac9] rounded shadow-sm hover:bg-[#fff] transition-colors"
                   >
                     +15m
                   </button>
                 </div>

                 <button 
                  onClick={() => adjustTime(30)}
                  className="p-2 hover:bg-[#8c3f3f]/10 text-[#5c4b40] rounded-lg transition-colors"
                  title="Fast Forward 30m"
                 >
                   <FastForward className="w-4 h-4" />
                 </button>

                 <div className="w-px h-6 bg-[#8c7b70]/30 mx-1"></div>

                 <button
                  onClick={jumpToBreak}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e3dac9] bg-[#8c3f3f] rounded shadow-sm hover:bg-[#7a3535] transition-colors flex items-center gap-1"
                  title="Jump to 5s before end"
                 >
                   <AlertCircle className="w-3 h-3" />
                   Break Egg
                 </button>
                 
                 {debugOffset !== 0 && (
                   <button
                    onClick={resetDebugTime}
                    className="ml-2 text-[10px] uppercase underline text-[#8c3f3f] hover:text-[#2b211e]"
                   >
                     Reset
                   </button>
                 )}
              </div>
           </div>
           
           {/* Next Up Preview */}
           {activeItem && nextItem && (
             <div className="mt-8 p-4 border-t border-[#bfa596] w-full text-center">
               <span className="text-xs uppercase tracking-widest text-[#8c7b70]">Coming Up Next at {nextItem.startTime}</span>
               <p className="font-display text-lg text-[#5c4b40]">{nextItem.title}</p>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default App;