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
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-black/40 backdrop-blur-2xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-md w-full border border-white/20 ring-1 ring-white/10 shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl md:text-2xl text-amber-300 font-cinzel font-bold tracking-wider">Criar Pista</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Carta selecionada */}
        <div className="flex justify-center mb-6">
          <GameCard card={card} size="lg" />
        </div>

        {/* Input da pista */}
        <div className="space-y-4">
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            placeholder="Digite uma pista misteriosa..."
            className="w-full bg-[#1A1A1A]/80 border border-white/10 focus:border-amber-500/50 p-4 rounded-xl text-white text-center text-lg italic outline-none transition-all duration-200 placeholder:text-white/30 placeholder:not-italic font-sans"
            autoFocus
            maxLength={100}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <p className="text-white/40 text-[10px] text-center uppercase tracking-widest font-sans font-medium">
            Dica: Não seja muito óbvio, nem muito abstrato!
          </p>

          <button
            onClick={handleSubmit}
            disabled={!clue.trim()}
            className={`w-full py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300 ${
              clue.trim()
                ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
            }`}
          >
            Enviar Carta e Pista
          </button>
        </div>
      </div>
    </div>
  );
};
