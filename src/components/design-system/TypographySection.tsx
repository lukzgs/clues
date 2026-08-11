import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';

interface TypographySectionProps {
  onCopy: (value: string, label: string) => void;
}

export const TypographySection: React.FC<TypographySectionProps> = ({
  onCopy,
}) => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [sampleText, setSampleText] = useState(
    'O Narrador sussurra um mistério entre as cartas da rodada.',
  );

  const typographySpecs = [
    {
      level: 'H1 — Título Principal',
      tag: 'h1',
      className: `font-cinzel text-4xl md:text-5xl tracking-tight ${theme.accentText} font-bold`,
      specs: 'Cinzel · 48px/3rem · Bold (700) · Tracking Tight',
    },
    {
      level: 'H2 — Título de Seção',
      tag: 'h2',
      className:
        'font-cinzel text-2xl md:text-3xl tracking-wide text-white font-semibold',
      specs: 'Cinzel · 30px/1.875rem · Semibold (600) · Tracking Wide',
    },
    {
      level: 'H3 — Subtítulo Elegante',
      tag: 'h3',
      className: `font-serif text-xl md:text-2xl ${theme.accentText} italic font-normal`,
      specs: 'Playfair Display · 24px/1.5rem · Italic (400)',
    },
    {
      level: 'H4 — Cabeçalho de Card',
      tag: 'h4',
      className:
        'font-cinzel text-lg text-white font-bold uppercase tracking-wider',
      specs: 'Cinzel · 18px/1.125rem · Bold (700) · Uppercase',
    },
    {
      level: 'Corpo — Texto Principal (Body)',
      tag: 'p',
      className:
        'font-sans text-base text-white/80 leading-relaxed font-normal',
      specs: 'Inter · 16px/1rem · Normal (400) · Leading Relaxed',
    },
    {
      level: 'Rótulo / Label Técnico',
      tag: 'span',
      className:
        'font-sans text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em] font-medium block',
      specs: 'Inter · 10px · Medium (500) · Uppercase · Tracking 0.2em',
    },
    {
      level: 'Badge / Distintivo Semântico',
      tag: 'span',
      className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-cinzel font-bold tracking-widest uppercase ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder} border shadow-sm`,
      specs: 'Cinzel · 12px · Bold (700) · Glass Badge',
    },
    {
      level: 'Numerais & Dados Tabulares (Inter)',
      tag: 'code',
      className: `tabular-nums font-sans text-xs ${theme.accentText} bg-black/60 border border-white/10 rounded-md px-3 py-1.5 inline-block font-semibold`,
      specs: 'Inter (Tabular Nums) · 12px · Dados & Placar',
    },
  ];

  return (
    <section id="tipografia" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span
            className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}
          >
            Seção 02
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Tipografia & Hierarquia de Texto
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            As famílias tipográficas{' '}
            <strong className={theme.accentText}>Cinzel</strong>,{' '}
            <strong className={theme.accentText}>Playfair Display</strong> e{' '}
            <strong className={theme.accentText}>Inter</strong> renderizadas com
            o tema{' '}
            <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>

        {/* Live Interactive Input */}
        <div className="w-full md:w-80">
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1.5 font-sans font-medium">
            Testar Frase em Tempo Real
          </label>

          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Digite algo para testar..."
            className={`w-full bg-[#1A1A1A]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:${theme.accentBorder} focus:ring-1 transition-all font-sans`}
          />
        </div>
      </div>

      {/* Typography List */}
      <div className="space-y-4">
        {typographySpecs.map((item, idx) => (
          <div
            key={idx}
            className={`bg-black/30 border border-white/10 rounded-2xl p-5 md:p-6 hover:${theme.accentBorder} transition-all duration-300 group flex flex-col gap-3`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <span
                className={`text-xs font-sans font-semibold tracking-wide uppercase ${theme.accentText}`}
              >
                {item.level}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-sans text-white/40">
                  {item.specs}
                </span>
                <button
                  onClick={() => onCopy(item.className, `Classe ${item.level}`)}
                  className={`text-[10px] font-sans uppercase tracking-widest font-bold bg-white/5 hover:${theme.accentBgLight} hover:${theme.accentText} text-white/60 border border-white/10 hover:${theme.accentBorder} px-3 py-1 rounded-lg transition-all`}
                >
                  Copiar Classe
                </button>
              </div>
            </div>

            {/* Rendered Preview */}
            <div className="pt-2 overflow-x-auto">
              <div className={item.className}>
                {sampleText ||
                  'Exemplo de texto para demonstração da tipografia'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
