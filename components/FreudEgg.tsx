import React, { useMemo } from 'react';

interface FreudEggProps {
  progress: number; // 0 (start) to 1 (end)
  isOvertime?: boolean;
}

export const FreudEgg: React.FC<FreudEggProps> = ({ progress, isOvertime = false }) => {
  // Clamped progress for the fill level
  const fillLevel = Math.min(Math.max(progress, 0), 1);
  
  // Calculate distinct colors based on state
  // Lucian Freud palette: pale flesh, bruised purples, earthy ochres, stark whites
  const baseColor = isOvertime ? '#4a3b32' : '#e6d2c4'; // Dark umber if overtime, pale flesh if running
  const fillColor = isOvertime ? '#8c3f3f' : '#bfa596'; // Reddish bruise if overtime, darker flesh if running
  
  return (
    <div className="relative w-64 h-80 mx-auto transition-all duration-1000">
      <svg
        viewBox="0 0 200 250"
        className={`w-full h-full drop-shadow-2xl transition-transform duration-500 ${isOvertime ? 'scale-[1.02]' : 'scale-100'}`}
        style={{ filter: 'drop-shadow(0px 10px 15px rgba(43, 33, 30, 0.4))' }}
      >
        <defs>
          {/* A filter to create the "impasto" oil paint texture */}
          <filter id="impasto">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>

          {/* A filter to distort the edges like rough brushstrokes */}
          <filter id="brushStroke">
            <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          
          <linearGradient id="eggGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5e6d8" /> {/* Highlight */}
            <stop offset="50%" stopColor="#dcd0c0" /> {/* Midtone */}
            <stop offset="100%" stopColor="#8c7b70" /> {/* Shadow */}
          </linearGradient>

          <mask id="fillMask">
            <rect x="0" y="0" width="200" height="250" fill="white" />
            {/* The liquid level moves down (or up, let's make it deplete like a timer) */}
            <rect 
              x="0" 
              y="0" 
              width="200" 
              height={250 * fillLevel} 
              fill="black" 
              className="transition-all duration-1000 ease-in-out"
            />
          </mask>
        </defs>

        {/* Background "Canvas" Egg */}
        <ellipse 
          cx="100" 
          cy="125" 
          rx="80" 
          ry="105" 
          fill="url(#eggGradient)" 
          filter="url(#brushStroke)"
          stroke="#5c4b40"
          strokeWidth="2"
          opacity="0.9"
        />

        {/* The "Filling" Egg - representing time passed/remaining */}
        <g mask="url(#fillMask)">
             <ellipse 
              cx="100" 
              cy="125" 
              rx="78" 
              ry="103" 
              fill={fillColor}
              filter="url(#impasto)"
              opacity="0.8"
            />
             {/* Add some "fleshy" highlights inside the fill */}
             <ellipse 
              cx="80" 
              cy="90" 
              rx="20" 
              ry="30" 
              fill="#fff0e6"
              opacity="0.3"
              filter="url(#brushStroke)"
            />
        </g>
        
        {/* Cracks / Texture Overlay - Becomes dramatically visible in Overtime */}
        <g className={`transition-all duration-1000 ${isOvertime ? 'opacity-100' : 'opacity-0'}`}>
            {/* Major Fissure - Top to Bottom */}
            <path 
                d="M 95 15 C 95 15, 110 50, 100 90 C 90 130, 115 160, 105 230" 
                stroke="#4a3b32" 
                strokeWidth="2" 
                fill="none" 
                filter="url(#brushStroke)"
            />
            
            {/* Branching Fissure Right */}
            <path 
                d="M 100 90 Q 140 80 165 110" 
                stroke="#4a3b32" 
                strokeWidth="1.5" 
                fill="none" 
                filter="url(#brushStroke)"
            />

            {/* Branching Fissure Left */}
            <path 
                d="M 100 90 Q 60 100 45 70" 
                stroke="#4a3b32" 
                strokeWidth="1.5" 
                fill="none" 
                filter="url(#brushStroke)"
            />
            
            {/* Lower Webbing */}
            <path 
                d="M 105 180 Q 130 190 140 220" 
                stroke="#4a3b32" 
                strokeWidth="1" 
                fill="none" 
                filter="url(#brushStroke)"
            />
             <path 
                d="M 105 180 Q 70 190 60 170" 
                stroke="#4a3b32" 
                strokeWidth="1" 
                fill="none" 
                filter="url(#brushStroke)"
            />
            
            {/* Horizontal Stress Fractures */}
            <path d="M 80 50 L 70 45" stroke="#4a3b32" strokeWidth="0.8" filter="url(#brushStroke)" />
            <path d="M 120 140 L 135 145" stroke="#4a3b32" strokeWidth="0.8" filter="url(#brushStroke)" />
        </g>
        
        {/* Subtle texture always present */}
        <path 
            d="M 100 20 Q 120 50 110 80" 
            stroke="#4a3b32" 
            strokeWidth="0.5" 
            fill="none" 
            filter="url(#brushStroke)"
            opacity="0.3"
        />

      </svg>
      
      {/* Overtime pulsing aura */}
      {isOvertime && (
        <div className="absolute inset-0 rounded-full animate-pulse bg-red-900/20 blur-3xl -z-10 transform scale-110 pointer-events-none transition-all duration-1000" />
      )}
    </div>
  );
};