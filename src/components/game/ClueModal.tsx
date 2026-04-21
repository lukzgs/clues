import { useState } from 'react';
import { Card } from '../../types';
import { GameCard } from './GameCard';

interface ClueModalProps {
  card: Card;
  onSubmit: (clue: string) => void;
  onClose: () => void;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  card,
  onSubmit,
  onClose,
}) => {
  const [clue, setClue] = useState('');

  const handleSubmit = () => {
    if (clue.trim()) {
      onSubmit(clue.trim());
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
          className="absolute top-4 right-4 md:top-6 md:right-6 text-white/40 hover:text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10"
        >
          ×
        </button>

        {/* Carta selecionada com tamanho FULL para alinhar borda a borda do padding */}
        <div className="w-full flex justify-center mb-6 md:mb-8 drop-shadow-2xl">
          <GameCard card={card} size="full" />
        </div>

        {/* Input da pista */}
        <div className="space-y-4 md:space-y-5">
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
        </div>
      </div>
    </div>
  );
};
