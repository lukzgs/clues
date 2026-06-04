import React from 'react';
import { useTranslation } from '../../i18n/index.tsx';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = "fixed top-4 right-4 z-[300]" }) => {
  const { lang, setLang } = useTranslation();

  const toggle = () => setLang(lang === 'pt' ? 'en' : 'pt');

  return (
    <button
      onClick={toggle}
      aria-label={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      className={`
        flex items-center gap-0 overflow-hidden
        bg-black/40 backdrop-blur-xl
        border border-white/15 rounded-xl
        shadow-lg
        transition-all duration-300
        hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]
        group
        ${className}
      `}
    >
      <LangPill label="PT" active={lang === 'pt'} onClick={() => setLang('pt')} />
      <div className="w-px h-5 bg-white/10" />
      <LangPill label="EN" active={lang === 'en'} onClick={() => setLang('en')} />
    </button>
  );
};


const LangPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <span
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`
      flex items-center justify-center
      px-3 h-full
      font-cinzel font-bold text-[10px] tracking-[0.2em] uppercase
      transition-all duration-200 cursor-pointer select-none
      ${active
        ? 'text-amber-300 bg-amber-500/15'
        : 'text-white/30 hover:text-white/60 bg-transparent'
      }
    `}
  >
    {label}
  </span>
);
