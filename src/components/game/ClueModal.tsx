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
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-black/50 backdrop-blur-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 w-full max-w-[420px] md:max-w-lg border border-white/20 ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-zoom-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button floating over the corner */}
        <button
          onClick={onClose}
          aria-label="Encerrar"
          className="absolute -top-12 right-0 md:-right-12 md:-top-10 text-white/50 hover:text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-[110] bg-black/40 backdrop-blur-md border border-white/10 shadow-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Prev / Next Buttons */}
        {onPrevCard && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrevCard(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 md:-left-16 text-white/50 hover:text-amber-300 w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/50 transition-all z-50 backdrop-blur-md border border-white/10 bg-black/40 shadow-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}

        {onNextCard && (
          <button
            onClick={(e) => { e.stopPropagation(); onNextCard(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 md:-right-16 text-white/50 hover:text-amber-300 w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/50 transition-all z-50 backdrop-blur-md border border-white/10 bg-black/40 shadow-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        )}

        {/* Carta selecionada com tamanho FULL para alinhar borda a borda do padding */}
        <div className="w-full flex justify-center mb-6 md:mb-8 drop-shadow-2xl">
          <GameCard card={card} size="full" />
        </div>

        {/* Input da pista ou Confirmação */}
        <div className="space-y-4 md:space-y-5">
          {mode === 'narrator' ? (
            <>
              <input
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="Digite uma pista misteriosa..."
                className="w-full bg-[#1A1A1A]/60 border border-white/20 focus:border-amber-500/60 p-5 rounded-2xl text-white text-center text-xl italic outline-none transition-all duration-300 placeholder:text-white/30 placeholder:not-italic font-cinzel shadow-inner"
                autoFocus
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />

              <p className="text-white/40 text-[10px] text-center uppercase tracking-widest font-sans font-medium mb-2">
                Dica: Não seja muito óbvio, nem muito abstrato!
              </p>

              <button
                onClick={handleSubmit}
                disabled={!clue.trim()}
                className={`w-full py-4 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300 mt-2 ${
                  clue.trim()
                    ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]'
                    : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                }`}
              >
                Enviar Carta e Pista
              </button>
            </>
          ) : (
            <>
              {clueText && (
                <div className="text-center mb-4">
                  <p className="text-amber-200/50 text-[10px] uppercase tracking-[0.25em] mb-2 font-sans font-bold">A pista é</p>
                  <p className="text-2xl text-amber-300 font-cinzel font-bold tracking-wider">"{clueText}"</p>
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300 bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] mt-2"
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
