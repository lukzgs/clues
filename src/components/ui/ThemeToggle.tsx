import React, { useContext } from 'react';
import { ThemeContext, THEMES, ThemeId } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const context = useContext(ThemeContext);
  const { lang } = useTranslation();

  const theme = context?.theme ?? THEMES['primary-gold'];
  const activeThemeId = context?.activeThemeId ?? 'primary-gold';
  const setTheme = context?.setTheme ?? (() => {});

  const themeIds = Object.keys(THEMES) as ThemeId[];

  const cycleTheme = () => {
    const currentIndex = themeIds.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    setTheme(themeIds[nextIndex]);
  };

  const isCustomPositioned = className.trim() !== '';
  const basePosition = isCustomPositioned ? '' : 'fixed top-4 right-20 z-[300]';

  return (
    <button
      onClick={cycleTheme}
      title={`Tema: ${theme.name[lang]} (Clique para alternar)`}
      aria-label={`Alternar tema visual (Atual: ${theme.name[lang]})`}
      className={`
        flex items-center justify-center
        bg-[#1A1A1A]/60 backdrop-blur-xl
        border border-white/10 rounded-xl
        shadow-lg w-10 h-10
        transition-all duration-300
        hover:${theme.accentBorder} hover:scale-[1.05]
        cursor-pointer select-none group
        ${basePosition}
        ${className}
      `}
    >
      {/* Palette Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-colors duration-300 ${theme.accentText}`}
      >
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.71 1.7-1.63 0-.44-.18-.85-.46-1.16-.27-.3-.43-.72-.43-1.18 0-.92.75-1.67 1.67-1.67h2.62c3.04 0 5.5-2.46 5.5-5.5 0-5.5-4.5-10-10-10z" />
      </svg>
    </button>
  );
};
