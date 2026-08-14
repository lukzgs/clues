import type React from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
}) => {
  const { lang, setLang } = useTranslation();

  const { theme } = useTheme();
  const accentText = theme.accentText;
  const accentBg = theme.accentBgLight;
  const accentBorder = theme.accentBorder;

  const toggle = () => setLang(lang === 'pt' ? 'en' : 'pt');

  const isCustomPositioned = className.trim() !== '';
  const basePosition = isCustomPositioned ? '' : 'fixed top-4 right-4 z-[300]';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      className={`
        flex items-center justify-between gap-1 overflow-hidden
        bg-[#1A1A1A]/60 backdrop-blur-xl
        border border-white/10 rounded-xl
        shadow-lg h-10 px-1
        transition-all duration-300
        hover:${accentBorder}
        cursor-pointer select-none
        focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
        ${basePosition}
        ${className}
      `}
    >
      <LangPill
        label="PT"
        active={lang === 'pt'}
        accentText={accentText}
        accentBg={accentBg}
        accentBorder={accentBorder}
      />
      <LangPill
        label="EN"
        active={lang === 'en'}
        accentText={accentText}
        accentBg={accentBg}
        accentBorder={accentBorder}
      />
    </button>
  );
};

const LangPill: React.FC<{
  label: string;
  active: boolean;
  accentText: string;
  accentBg: string;
  accentBorder: string;
}> = ({ label, active, accentText, accentBg, accentBorder }) => (
  <span
    className={`
      flex items-center justify-center
      w-10 h-[80%] rounded-lg
      font-cinzel font-bold text-[10px] tracking-[0.1em]
      transition-all duration-300
      ${
        active
          ? `${accentText} ${accentBg} border ${accentBorder} shadow-sm`
          : 'text-white/30 bg-transparent border border-transparent'
      }
    `}
  >
    {label}
  </span>
);
