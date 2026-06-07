import React from 'react';
import { LanguageToggle } from '../../ui/LanguageToggle';

interface GameHeaderProps {
  roomCode: string;
  onLeaveRoom: () => void;
  phaseLabel: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ roomCode, onLeaveRoom, phaseLabel }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <LanguageToggle />
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg mt-2">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-sans font-bold mb-0.5">
            SALA
          </p>
          <p className="text-amber-300 font-cinzel font-bold text-lg tracking-wider">
            {roomCode}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={onLeaveRoom}
          className="bg-black/60 backdrop-blur-md text-white/50 hover:text-white/90 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-sans font-bold transition-all duration-300 flex items-center gap-2"
        >
          <span>SAIR</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg text-right mt-2">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-sans font-bold mb-0.5">
            FASE ATUAL
          </p>
          <p className="text-white/90 font-cinzel font-bold text-sm md:text-base tracking-wider capitalize">
            {phaseLabel}
          </p>
        </div>
      </div>
    </div>
  );
};
