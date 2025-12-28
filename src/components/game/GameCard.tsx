import React from 'react';
import { Card } from '../../types';

interface GameCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  isHidden?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  card,
  size = 'md',
  isHidden = false,
  isSelected = false,
  isHighlighted = false,
  highlightColor,
  disabled = false,
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-28 h-40',
    lg: 'w-40 h-56',
  };

  const isClickable = onClick && !disabled;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        relative rounded-xl overflow-hidden transition-all duration-200
        ${sizeClasses[size]}
        ${isClickable ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : ''}
        ${isSelected ? 'ring-4 ring-amber-400 scale-105' : ''}
        ${isHighlighted ? 'ring-4 scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
        shadow-xl
      `}
      style={isHighlighted && highlightColor ? { '--tw-ring-color': highlightColor } as any : undefined}
    >
      {isHidden || card.id === -1 ? (
        // Carta virada
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-2 border-slate-700">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-slate-500 text-lg">?</span>
          </div>
        </div>
      ) : (
        // Carta visível
        <>
          <img
            src={card.imageUrl}
            alt={`Card ${card.id}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
};
