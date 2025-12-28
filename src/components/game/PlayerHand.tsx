import React, { useState } from 'react';
import { Player, Card } from '../../types';
import { GameCard } from './GameCard';
import { CardPreviewModal } from './CardPreviewModal';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleCardClick = () => {
    if (!disabled) {
      setIsPreviewOpen(true);
    }
  };

  const handleSelectCard = (card: Card) => {
    onCardSelect(card);
    setIsPreviewOpen(false);
  };

  return (
    <>
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

        {/* Cartas - clique abre o preview */}
        <div 
          className={`
            bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 
            p-4 flex justify-center gap-3 flex-wrap min-h-[140px]
            ${disabled ? 'opacity-50' : 'cursor-pointer'}
          `}
          onClick={handleCardClick}
        >
          {player.hand.map((card) => (
            <div 
              key={card.id} 
              className={`transition-transform ${!disabled ? 'hover:-translate-y-2' : ''}`}
            >
              <GameCard
                card={card}
                size="sm"
                disabled={disabled}
              />
            </div>
          ))}
          {player.hand.length === 0 && (
            <p className="text-slate-600 self-center">Sem cartas</p>
          )}
          {!disabled && player.hand.length > 0 && (
            <div className="absolute top-2 right-6 text-xs text-slate-500">
              Clique para ver e escolher
            </div>
          )}
        </div>
      </div>

      {/* Modal de preview */}
      <CardPreviewModal
        cards={player.hand}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onSelectCard={handleSelectCard}
        title={isNarrator ? 'Escolha a carta para a dica' : 'Escolha uma carta para jogar'}
        selectButtonText={isNarrator ? 'Escolher esta carta' : 'Jogar esta carta'}
      />
    </>
  );
};
