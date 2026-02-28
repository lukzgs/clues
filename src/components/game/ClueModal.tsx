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
        className="bg-slate-900/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-800 shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl md:text-2xl text-amber-400 font-display">Criar Pista</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
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
            className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white text-center text-lg italic outline-none transition-all duration-200 placeholder:text-slate-600 placeholder:not-italic"
            autoFocus
            maxLength={100}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <p className="text-slate-500 text-xs text-center">
            Dica: Não seja muito óbvio, nem muito abstrato!
          </p>

          <button
            onClick={handleSubmit}
            disabled={!clue.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed py-4 rounded-xl font-bold font-display transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            Enviar Carta e Pista
          </button>
        </div>
      </div>
    </div>
  );
};
