import React, { useState } from 'react';
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
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl text-amber-400 cinzel">Criar Pista</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white text-2xl leading-none"
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
            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white text-center text-lg italic outline-none transition-colors"
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed py-4 rounded-xl font-bold cinzel transition-colors"
          >
            Enviar Carta e Pista
          </button>
        </div>
      </div>
    </div>
  );
};
