import React, { useState } from 'react';
import { Player, Card } from '../../types';
import { GameCard } from './GameCard';

interface PlayerHandProps {
  player: Player;
  deckCount: number;
  onCardSelect: (card: Card) => void;
  disabled?: boolean;
  isNarrator?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  deckCount,
  onCardSelect,
  disabled = false,
  isNarrator = false,
}) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleCardClick = (card: Card) => {
    if (disabled) return;

    if (selectedCard?.id === card.id) {
      // Clicou na mesma carta - deseleciona
      setSelectedCard(null);
    } else {
      // Seleciona a carta clicada
      setSelectedCard(card);
    }
  };

  const handleConfirm = () => {
    if (selectedCard) {
      onCardSelect(selectedCard);
      setSelectedCard(null);
    }
  };

  const handleCancel = () => {
    setSelectedCard(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Info bar */}
      <div className="flex justify-between items-center px-6 mb-2">
        <div className="bg-slate-900/90 backdrop-blur px-4 py-2 rounded-t-xl flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          <span className="text-white text-sm font-medium">
            {player.name}
          </span>
          <span className="text-slate-500 text-xs">
            ({player.hand.length} cartas)
          </span>
        </div>
        <div className="text-slate-600 text-xs">
          {deckCount} no baralho
        </div>
      </div>

      {/* Cartas */}
      <div
        className={`
          bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 
          p-4 flex justify-center gap-3 flex-wrap min-h-[140px]
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {player.hand.map((card) => {
          const isSelected = selectedCard?.id === card.id;

          return (
            <div
              key={card.id}
              className={`
                transition-all duration-300 
                ${isSelected ? '-translate-y-8 scale-125 z-10' : ''}
                ${!disabled && !isSelected ? 'hover:-translate-y-2' : ''}
              `}
            >
              <GameCard
                card={card}
                size="sm"
                isSelected={isSelected}
                disabled={disabled}
                onClick={() => handleCardClick(card)}
              />
            </div>
          );
        })}
        {player.hand.length === 0 && (
          <p className="text-slate-600 self-center">Sem cartas</p>
        )}
        {!disabled && player.hand.length > 0 && !selectedCard && (
          <div className="absolute top-2 right-6 text-xs text-slate-500">
            Clique em uma carta para selecionar
          </div>
        )}
      </div>

      {/* Botões de confirmação quando carta selecionada */}
      {selectedCard && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex gap-3 animate-fade-in">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
          >
            {isNarrator ? 'Escolher esta carta' : 'Jogar esta carta'}
          </button>
        </div>
      )}
    </div>
  );
};
