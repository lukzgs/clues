import { Card } from '../../types';

interface GameCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg' | 'table' | 'xl' | 'full';
  isHidden?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  loading?: 'lazy' | 'eager';
  dimWhenDisabled?: boolean;
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
  loading = 'lazy',
  dimWhenDisabled = true,
}) => {
  // Tamanhos responsivos
  const sizeClasses = {
    sm: 'w-16 h-24 md:w-20 md:h-28',
    md: 'w-24 h-36 md:w-32 md:h-44 lg:w-36 lg:h-52',
    lg: 'w-32 h-48 md:w-40 md:h-56 lg:w-44 lg:h-64',
    table: 'w-40 h-60 md:w-48 md:h-72 lg:w-56 lg:h-84',
    xl: 'w-48 h-[18rem] md:w-64 md:h-[24rem] lg:w-80 lg:h-[30rem]',
    full: 'w-full aspect-[2/3]',
  };

  const isClickable = onClick && !disabled;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300
        ${sizeClasses[size]}
        ${isClickable
          ? 'cursor-pointer hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
          : ''
        }
        ${isSelected
          ? 'ring-4 ring-amber-400 scale-105 -translate-y-2 shadow-xl shadow-amber-500/30'
          : ''
        }
        ${isHighlighted
          ? 'ring-4 scale-105 shadow-xl'
          : ''
        }
        ${disabled && dimWhenDisabled
          ? 'opacity-50 cursor-not-allowed grayscale-[30%]'
          : disabled && !dimWhenDisabled
          ? 'cursor-not-allowed'
          : ''
        }
        ${className}
        shadow-lg
      `}
      style={isHighlighted && highlightColor ? { '--tw-ring-color': highlightColor } as React.CSSProperties : undefined}
    >
      {isHidden || card.id === -1 ? (
        // Carta virada (verso)
        <img
          src="/cards/new/back_001.avif"
          alt="Card back"
          className="w-full h-full object-cover"
          loading={loading}
        />
      ) : (
        // Carta visível (frente)
        <>
          <img
            src={card.imageUrl}
            alt={`Card ${card.id}`}
            className="w-full h-full object-cover"
            loading={loading}
            onError={(e) => { (e.target as HTMLImageElement).src = '/cards/new/back_001.avif'; }}
          />
          {/* Overlay sutil no topo e base */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
        </>
      )}
    </div>
  );
};
