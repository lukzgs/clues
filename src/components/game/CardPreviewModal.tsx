import React, { useState } from 'react';
import { Card } from '../../types';
import { GameCard } from './GameCard';

interface CardPreviewModalProps {
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
  title?: string;
  selectButtonText?: string;
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  cards,
  isOpen,
  onClose,
  onSelectCard,
  title = 'Escolha uma carta',
  selectButtonText = 'Jogar esta carta',
}) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedCard) {
      onSelectCard(selectedCard);
      setSelectedCard(null);
    }
  };

  const handleClose = () => {
    setSelectedCard(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
            {cards.map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-2">
                <GameCard
                  card={card}
                  size="lg"
                  isSelected={selectedCard?.id === card.id}
                  onClick={() => setSelectedCard(card)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer with selected card preview and action */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/95">
          {selectedCard ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <GameCard card={selectedCard} size="sm" />
                <div>
                  <p className="text-white font-medium">Carta selecionada</p>
                  <p className="text-slate-400 text-sm">Clique no botão para confirmar</p>
                </div>
              </div>
              <button
                onClick={handleSelect}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
              >
                {selectButtonText}
              </button>
            </div>
          ) : (
            <p className="text-center text-slate-500">
              Clique em uma carta para selecioná-la
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
