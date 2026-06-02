import React from 'react';
import { cn } from '../lib/utils';

interface HumanBodySVGProps {
  area: 'Upper Limb' | 'Lower Limb' | 'Torso';
  onPartClick?: (part: string) => void;
}

const HumanBodySVG: React.FC<HumanBodySVGProps> = ({ area, onPartClick }) => {
  return (
    <div className="relative w-full aspect-[3/4] flex items-center justify-center p-4 rounded-[2rem] overflow-hidden">
      <svg 
        viewBox="0 0 200 400" 
        className="w-full h-full drop-shadow-2xl"
        fill="currentColor"
      >
        {/* Shadow Background */}
        <path d="M100 20 c5 0 10 5 10 10 s-5 10 -10 10 s-10 -5 -10 -10 s5 -10 10 -10 Z" fill="rgba(255,255,255,0.05)" />
        
        {/* Head & Neck */}
        <circle cx="100" cy="30" r="15" className="fill-slate-800" />
        <path d="M92 45 h16 v15 h-16 Z" className="fill-slate-800" />
        
        {/* Torso */}
        <path 
          d="M70 65 h60 c10 0 15 5 15 15 v90 c0 10 -5 15 -15 15 h-60 c-10 0 -15 -5 -15 -15 v-90 c0 -10 5 -15 15 -15 Z" 
          className={cn(
            "transition-all duration-500",
            area === 'Torso' ? "fill-blue-500 stroke-[4] stroke-blue-400" : "fill-slate-800 opacity-40 hover:opacity-60"
          )}
        />
        
        {/* Arms */}
        {/* Left Arm */}
        <path 
          d="M70 70 l-30 20 c-5 3 -8 8 -8 15 v60 c0 5 3 10 8 10 h12 v-60 l18 -20 Z" 
          className={cn(
            "transition-all duration-500",
            area === 'Upper Limb' ? "fill-blue-500 stroke-[4] stroke-blue-400" : "fill-slate-800 opacity-40"
          )}
        />
        {/* Right Arm */}
        <path 
          d="M130 70 l30 20 c5 3 8 8 8 15 v60 c0 5 -3 10 -8 10 h-12 v-60 l-18 -20 Z" 
          className={cn(
            "transition-all duration-500",
            area === 'Upper Limb' ? "fill-blue-500 stroke-[4] stroke-blue-400" : "fill-slate-800 opacity-40"
          )}
        />
        
        {/* Legs */}
        {/* Left Leg */}
        <path 
          d="M75 185 v160 c0 8 5 12 12 12 h15 v-172 Z" 
          className={cn(
            "transition-all duration-500",
            area === 'Lower Limb' ? "fill-blue-500 stroke-[4] stroke-blue-400" : "fill-slate-800 opacity-40"
          )}
        />
        {/* Right Leg */}
        <path 
          d="M125 185 v160 c0 8 -5 12 -12 12 h-15 v-172 Z" 
          className={cn(
            "transition-all duration-500",
            area === 'Lower Limb' ? "fill-blue-500 stroke-[4] stroke-blue-400" : "fill-slate-800 opacity-40"
          )}
        />

        {/* Leg Landmarks */}
        {area === 'Lower Limb' && (
          <>
            <circle cx="85" cy="340" r="12" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Ankle')} />
            <circle cx="115" cy="340" r="12" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Ankle')} />
            
            <circle cx="85" cy="280" r="15" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Calf')} />
            <circle cx="115" cy="280" r="15" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Calf')} />
            
            <circle cx="85" cy="235" r="12" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Knee')} />
            <circle cx="115" cy="235" r="12" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Knee')} />
            
            <circle cx="85" cy="190" r="15" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Thigh')} />
            <circle cx="115" cy="190" r="15" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Thigh')} />
          </>
        )}

        {/* Torso Landmarks */}
        {area === 'Torso' && (
          <>
            <rect x="75" y="80" width="50" height="20" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Chest')} />
            <rect x="75" y="110" width="50" height="20" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Waist')} />
            <rect x="75" y="140" width="50" height="20" className="fill-transparent hover:fill-blue-500/20 cursor-pointer transition-colors" onClick={() => onPartClick?.('Abdomen')} />
          </>
        )}

        {/* Pulse Indicators for Active Area */}
        {area === 'Lower Limb' && (
          <g className="animate-pulse">
            <circle cx="85" cy="220" r="4" fill="#fbbf24" shadow-lg="true" />
            <circle cx="115" cy="220" r="4" fill="#fbbf24" />
          </g>
        )}
        {area === 'Upper Limb' && (
          <g className="animate-pulse">
            <circle cx="50" cy="120" r="4" fill="#fbbf24" />
            <circle cx="150" cy="120" r="4" fill="#fbbf24" />
          </g>
        )}
        {area === 'Torso' && (
          <g className="animate-pulse">
            <circle cx="100" cy="100" r="4" fill="#fbbf24" />
          </g>
        )}
      </svg>
      
      {/* Legend / Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center shadow-2xl">
          <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Anatomical Focus</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <p className="text-[10px] font-black text-white uppercase tracking-wider">{area}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanBodySVG;

