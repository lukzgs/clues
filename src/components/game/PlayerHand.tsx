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
      setSelectedCard(null);
    } else {
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
      <div className="flex justify-between items-center px-4 md:px-6 mb-2">
        <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-t-xl flex items-center gap-2 border border-slate-800 border-b-0">
          <div
            className="w-3 h-3 rounded-full shadow-inner"
            style={{ backgroundColor: player.color }}
          />
          <span className="text-white text-sm font-medium">
            {player.name}
          </span>
          <span className="text-slate-500 text-xs">
            ({player.hand.length} cartas)
          </span>
        </div>
        <div className="text-slate-600 text-xs bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-t-lg">
          {deckCount} no baralho
        </div>
      </div>

      {/* Área das cartas */}
      <div
        className={`
          bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 
          px-4 py-4 md:py-5 flex justify-center gap-2 md:gap-3 flex-wrap min-h-[120px] md:min-h-[140px]
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        {player.hand.map((card) => {
          const isSelected = selectedCard?.id === card.id;

          return (
            <div
              key={card.id}
              className={`
                transition-all duration-300 ease-out
                ${isSelected ? '-translate-y-6 md:-translate-y-8 scale-110 z-10' : ''}
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
          <div className="absolute top-3 right-4 md:right-6 text-xs text-slate-500">
            Toque em uma carta para selecionar
          </div>
        )}
      </div>

      {/* Botões de confirmação */}
      {selectedCard && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 flex gap-3 animate-fade-in">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/30 active:scale-95"
          >
            {isNarrator ? 'Escolher carta' : 'Jogar carta'}
          </button>
        </div>
      )}
    </div>
  );
};
