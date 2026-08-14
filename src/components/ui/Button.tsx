import type React from 'react';
import { useTheme } from '../../providers/ThemeProvider';

export type ButtonVariant =
  | 'primary'
  | 'glass'
  | 'outline'
  | 'destructive'
  | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'only';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-[10px]',
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-4 py-3 text-xs md:text-sm',
    lg: 'px-6 py-4 text-sm md:text-base',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: `${theme.primaryGradient} text-black font-cinzel font-bold uppercase tracking-widest ${theme.glowShadow} hover:scale-[1.02] active:scale-[0.98]`,
    glass:
      'bg-white/5 border border-white/10 text-white font-cinzel font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98]',
    outline: `bg-transparent border ${theme.accentBorder} ${theme.accentText} font-cinzel font-bold uppercase tracking-widest hover:${theme.accentBgLight} hover:scale-[1.02] active:scale-[0.98]`,
    destructive:
      'bg-red-950/40 border border-red-500/40 text-red-200 font-cinzel font-bold uppercase tracking-widest hover:bg-red-900/60 hover:border-red-500/70 hover:scale-[1.02] active:scale-[0.98]',
    ghost:
      'bg-transparent border border-white/20 text-white/70 font-cinzel font-semibold uppercase tracking-widest hover:bg-white/10 hover:border-white/40 hover:text-white active:scale-[0.98]',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={props.type || 'button'}
      disabled={isDisabled}
      className={`
        rounded-xl flex items-center justify-center gap-2 transition-all duration-300 select-none
        focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus-visible:ring-offset-1 focus-visible:ring-offset-black
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none grayscale' : 'cursor-pointer'}
        ${iconPosition === 'only' ? 'p-3! shrink-0' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      ) : (
        iconPosition === 'left' && icon
      )}

      {iconPosition === 'only' ? !isLoading && icon : children}

      {!isLoading && iconPosition === 'right' && icon}
    </button>
  );
};
