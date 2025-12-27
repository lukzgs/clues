
import React from 'react';
import { Card } from '../types';

interface GameCardProps {
  card: Card;
  isSelected?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GameCard: React.FC<GameCardProps> = ({ 
  card, 
  isSelected, 
  isRevealed = true, 
  onClick, 
  disabled, 
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-24 h-36',
    md: 'w-32 h-48',
    lg: 'w-48 h-72'
  };

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        ${sizeClasses[size]}
        ${isSelected ? 'ring-4 ring-amber-400 scale-105 z-10' : 'hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'opacity-100'}
        ${className}
        shadow-2xl perspective-1000
      `}
    >
      <div className={`w-full h-full relative card-inner ${!isRevealed ? 'card-flipped' : ''}`}>
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <img 
            src={card.imageUrl} 
            alt={card.alt} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-slate-900 flex items-center justify-center rotate-y-180" style={{ transform: 'rotateY(180deg)' }}>
          <div className="w-full h-full p-4 border-4 border-slate-800 rounded-xl flex items-center justify-center">
            <div className="text-slate-700 text-4xl cinzel">?</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
