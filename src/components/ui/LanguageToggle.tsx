import React from 'react';
import { useTranslation } from '../../i18n/index.tsx';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = "" }) => {
  const { lang, setLang } = useTranslation();

  const toggle = () => setLang(lang === 'pt' ? 'en' : 'pt');

  const isCustomPositioned = className.trim() !== '';
  const basePosition = isCustomPositioned ? '' : 'fixed top-4 right-4 z-[300]';

  return (
    <button
      onClick={toggle}
      aria-label={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      className={`
        flex items-center justify-between gap-1 overflow-hidden
        bg-[#1A1A1A]/60 backdrop-blur-xl
        border border-white/10 rounded-xl
        shadow-lg h-10 px-1
        transition-all duration-300
        hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]
        cursor-pointer select-none
        ${basePosition}
        ${className}
      `}
    >
      <LangPill label="PT" active={lang === 'pt'} />
      <LangPill label="EN" active={lang === 'en'} />
    </button>
  );
};


const LangPill: React.FC<{ label: string; active: boolean }> = ({
  label,
  active,
}) => (
  <span
    className={`
      flex items-center justify-center
      w-10 h-[80%] rounded-lg
      font-cinzel font-bold text-[10px] tracking-[0.1em]
      transition-all duration-200
      ${active
        ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
        : 'text-white/30 bg-transparent border border-transparent'
      }
    `}
  >
    {label}
  </span>
);
