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
      {/* Background with radial gradient for depth */}
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1),transparent_70%)]" />
      
      <div
        className="relative bg-[#111111]/80 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3.5rem] p-4 md:p-10 w-full max-w-[500px] md:max-w-2xl border border-white/10 ring-1 ring-white/5 shadow-[0_0_100px_rgba(0,0,0,0.9)] animate-zoom-in flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button floating over the corner */}
        <button
          onClick={onClose}
          aria-label="Encerrar"
          className="absolute -top-12 right-0 md:top-6 md:right-6 text-white/40 hover:text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-all z-[110] bg-black/20 backdrop-blur-md border border-white/10 shadow-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Prev / Next Buttons */}
        {onPrevCard && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrevCard(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 md:-left-20 text-white/30 hover:text-amber-300 w-14 h-14 flex items-center justify-center rounded-full hover:bg-white/5 transition-all z-50 backdrop-blur-md border border-white/10 bg-black/40 shadow-2xl group"
          >
            <svg className="group-hover:scale-110 transition-transform" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}

        {onNextCard && (
          <button
            onClick={(e) => { e.stopPropagation(); onNextCard(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 md:-right-20 text-white/30 hover:text-amber-300 w-14 h-14 flex items-center justify-center rounded-full hover:bg-white/5 transition-all z-50 backdrop-blur-md border border-white/10 bg-black/40 shadow-2xl group"
          >
            <svg className="group-hover:scale-110 transition-transform" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        )}

        {/* Carta selecionada - Increased size and improved shadow */}
        <div className="w-full max-w-[320px] md:max-w-[440px] flex justify-center mb-8 md:mb-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <GameCard card={card} size="full" className="ring-1 ring-white/10" />
        </div>

        {/* Input da pista ou Confirmação */}
        <div className="w-full space-y-6 md:space-y-8 max-w-md">
          {mode === 'narrator' ? (
            <>
              <div className="space-y-4">
                <h2 className="text-amber-400 font-cinzel text-center text-sm md:text-base uppercase tracking-[0.3em] font-bold">Criar Pista</h2>
                <input
                  type="text"
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                  placeholder="Digite uma pista misteriosa..."
                  className="w-full bg-[#1A1A1A]/80 border-b-2 border-white/10 focus:border-amber-500/60 p-6 rounded-2xl text-white text-center text-2xl italic outline-none transition-all duration-300 placeholder:text-white/20 placeholder:not-italic font-cinzel"
                  autoFocus
                  maxLength={100}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />

                <p className="text-white/30 text-[10px] text-center uppercase tracking-widest font-sans font-medium">
                  Dica: Não seja muito óbvio, nem muito abstrato!
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!clue.trim()}
                className={`w-full py-5 rounded-2xl font-cinzel font-bold uppercase tracking-[0.2em] text-sm md:text-base transition-all duration-500 ${
                  clue.trim()
                    ? 'bg-amber-400 text-black hover:bg-amber-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]'
                    : 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed'
                }`}
              >
                Enviar Carta e Pista
              </button>
            </>
          ) : (
            <>
              {clueText && (
                <div className="text-center mb-6">
                  <p className="text-amber-400/50 text-[11px] uppercase tracking-[0.4em] mb-4 font-sans font-bold">A pista é</p>
                  <p className="text-3xl md:text-4xl text-amber-200 font-cinzel font-bold tracking-widest leading-tight">"{clueText}"</p>
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                className="w-full py-5 rounded-2xl font-cinzel font-bold uppercase tracking-[0.2em] text-sm md:text-base transition-all duration-500 bg-amber-400 text-black hover:bg-amber-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]"
              >
                {mode === 'voter' ? 'Confirmar Voto' : 'Confirmar Carta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
