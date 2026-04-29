import { useState } from 'react';
import { Card } from '../../types';
import { GameCard } from './GameCard';

interface ClueModalProps {
  card: Card;
  mode?: 'narrator' | 'player' | 'voter';
  clueText?: string; // Optional: To show the current clue when player is guessing
  onSubmit: (clue?: string) => void;
  onClose: () => void;
  onNextCard?: () => void; // Changed logic outside to handle table cards
  onPrevCard?: () => void;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  card,
  mode = 'narrator',
  clueText,
  onSubmit,
  onClose,
  onNextCard,
  onPrevCard,
}) => {
  const [clue, setClue] = useState('');

  const handleSubmit = () => {
    if (mode === 'narrator') {
      if (clue.trim()) {
        onSubmit(clue.trim());
      }
    } else {
      onSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      {/* Background overlay — deep black with subtle amber radial */}
      <div className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.06),transparent_60%)]" />

      {/* Modal panel + controls wrapper */}
      <div className="relative flex items-center justify-center w-full max-w-md md:max-w-lg animate-zoom-in" onClick={(e) => e.stopPropagation()}>

        {/* Close Button — above the card group, outside everything */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-14 right-0 text-white/50 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:bg-white/10 transition-all z-[110] shadow-xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>



        {/* Card panel */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 w-full flex flex-col items-center">

          {/* Card display — generous size for viewing */}
          <div className="w-full flex justify-center mb-6 mt-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] px-2 sm:px-6">
            <GameCard card={card} size="full" className="ring-1 ring-white/10 w-full max-w-[320px] md:max-w-[360px]" />
          </div>

          {/* Bottom section: clue input or confirmation */}
          <div className="w-full space-y-4 md:space-y-5 px-1">
            
            {/* Header with Arrows */}
            <div className="flex items-center justify-between">
              <div className="w-10 sm:w-12">
                {onPrevCard && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrevCard(); }}
                    className="shrink-0 text-white/30 hover:text-amber-300 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-white/5 transition-all backdrop-blur-md border border-white/10 bg-black/40 shadow-xl group"
                  >
                    <svg className="group-hover:scale-110 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                )}
              </div>

              <div className="flex-1 flex justify-center">
                {mode === 'narrator' ? (
                  <label className="text-amber-400/80 text-[10px] uppercase tracking-[0.3em] font-sans font-bold">
                    Create Clue
                  </label>
                ) : clueText ? (
                  <p className="text-amber-400/40 text-[9px] uppercase tracking-[0.4em] font-sans font-bold">
                    The clue is
                  </p>
                ) : (
                  <p className="text-amber-400/40 text-[9px] uppercase tracking-[0.4em] font-sans font-bold">
                    Card Selection
                  </p>
                )}
              </div>

              <div className="w-10 sm:w-12 flex justify-end">
                {onNextCard && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNextCard(); }}
                    className="shrink-0 text-white/30 hover:text-amber-300 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-white/5 transition-all backdrop-blur-md border border-white/10 bg-black/40 shadow-xl group"
                  >
                    <svg className="group-hover:scale-110 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                )}
              </div>
            </div>

            {mode === 'narrator' ? (
              <>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    placeholder="Write a mysterious clue..."
                    className="w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-white text-center text-base sm:text-lg italic placeholder-white/20 placeholder:not-italic focus:outline-none focus:border-amber-500/50 focus:bg-[#1A1A1A]/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-cinzel"
                    autoFocus
                    maxLength={100}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <p className="text-white/25 text-[8px] sm:text-[9px] text-center uppercase tracking-[0.2em] font-sans font-medium">
                    Tip: Don't be too obvious or too abstract!
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!clue.trim()}
                  className={`w-full font-cinzel font-bold uppercase tracking-widest rounded-xl px-4 py-3 sm:py-3.5 flex items-center justify-center gap-2 transition-all duration-300 text-sm ${
                    clue.trim()
                      ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  Submit Card & Clue
                  {clue.trim() && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 ml-1">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <>
                {clueText && (
                  <div className="text-center mb-4">
                    <p className="text-xl sm:text-2xl md:text-3xl text-amber-200 font-cinzel font-bold tracking-wider leading-tight">"{clueText}"</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full font-cinzel font-bold uppercase tracking-widest bg-gradient-to-r from-amber-200 to-amber-400 text-black rounded-xl px-4 py-3 sm:py-3.5 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300 text-sm"
                >
                  {mode === 'voter' ? 'Confirm Vote' : 'Confirm Card'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 ml-1">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
