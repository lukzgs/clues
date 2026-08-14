import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';

interface ButtonMatrixSectionProps {
  onCopy: (value: string, label: string) => void;
}

export const ButtonMatrixSection: React.FC<ButtonMatrixSectionProps> = ({
  onCopy,
}) => {
  const { theme } = useTheme();
  const { lang, t } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<
    'primary' | 'glass' | 'outline' | 'destructive' | 'ghost'
  >('primary');
  const [activeTab, setActiveTab] = useState<'matrix' | 'interactive'>(
    'matrix',
  );

  // Interactive playground state
  const [size, setSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('md');
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iconPos, setIconPos] = useState<'none' | 'left' | 'right' | 'only'>(
    'left',
  );
  const [buttonText, setButtonText] = useState('Criar Nova Sala');

  // Crown SVG Icon
  const CrownIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
      <line x1="2" y1="19" x2="22" y2="19" />
    </svg>
  );

  // Arrow Right SVG Icon
  const ArrowIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  // Spinner Icon
  const SpinnerIcon = (
    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
  );

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-[10px]',
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-4 py-3 text-sm md:text-base',
    lg: 'px-6 py-4 text-base md:text-lg',
  };

  const variantClasses = {
    primary: `${theme.primaryGradient} font-cinzel font-bold uppercase tracking-widest ${theme.glowShadow} hover:scale-[1.02] active:scale-[0.98]`,
    glass:
      'bg-white/5 border border-white/10 text-white font-cinzel font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98]',
    outline: `bg-transparent border ${theme.accentBorder} ${theme.accentText} font-cinzel font-bold uppercase tracking-widest hover:${theme.accentBgLight} hover:scale-[1.02] active:scale-[0.98]`,
    destructive:
      'bg-red-950/40 border border-red-500/40 text-red-200 font-cinzel font-bold uppercase tracking-widest hover:bg-red-900/60 hover:border-red-500/70 hover:scale-[1.02] active:scale-[0.98]',
    ghost:
      'bg-transparent border border-white/20 text-white/70 font-cinzel font-semibold uppercase tracking-widest hover:bg-white/10 hover:border-white/40 hover:text-white active:scale-[0.98]',
  };

  const getCombinedClasses = (
    v: typeof selectedVariant,
    s: typeof size,
    disabled = false,
  ) => {
    return `rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${sizeClasses[s]} ${variantClasses[v]} ${disabled ? 'opacity-40 pointer-events-none grayscale' : ''}`;
  };

  return (
    <section id="botoes" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span
            className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}
          >
            Seção 03
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Botões & Ações (Button System)
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Matriz completa de botões adaptada dinamicamente ao tema ativo{' '}
            <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeTab === 'matrix'
                ? `${theme.primaryGradient} shadow-md`
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.sysd.generalMatrix}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeTab === 'interactive'
                ? `${theme.primaryGradient} shadow-md`
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.sysd.interactivePlayground}
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        /* MATRIX VIEW */
        <div className="space-y-6">
          {/* Variant Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(
              ['primary', 'glass', 'outline', 'destructive', 'ghost'] as const
            ).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setSelectedVariant(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium uppercase tracking-wider border transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  selectedVariant === v
                    ? `${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`
                    : 'bg-black/30 text-white/60 border-white/10 hover:bg-white/5'
                }`}
              >
                Variante: {v.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Matrix Grid */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Sizes Showcase */}
            <div>
              <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-white/40 mb-3 font-semibold">
                1. Escala de Tamanhos ({selectedVariant.toUpperCase()})
              </h3>
              <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'xs')}
                >
                  {CrownIcon} XS (Extra Small)
                </button>
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'sm')}
                >
                  {CrownIcon} Small (SM)
                </button>
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'md')}
                >
                  {CrownIcon} Medium (MD)
                </button>
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'lg')}
                >
                  {CrownIcon} Large (LG)
                </button>
              </div>
            </div>

            {/* States Showcase */}
            <div>
              <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-white/40 mb-3 font-semibold">
                2. Estados Possíveis (Normal, Disabled, Loading)
              </h3>
              <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="text-center space-y-1.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-white/30 block">
                    Normal
                  </span>
                  <button
                    type="button"
                    className={getCombinedClasses(selectedVariant, 'md')}
                  >
                    Ação Normal
                  </button>
                </div>

                <div className="text-center space-y-1.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-white/30 block">
                    Disabled
                  </span>
                  <button
                    type="button"
                    className={getCombinedClasses(selectedVariant, 'md', true)}
                    disabled
                  >
                    Ação Desabilitada
                  </button>
                </div>

                <div className="text-center space-y-1.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-white/30 block">
                    Loading
                  </span>
                  <button
                    type="button"
                    className={getCombinedClasses(selectedVariant, 'md')}
                  >
                    {SpinnerIcon} Processando...
                  </button>
                </div>
              </div>
            </div>

            {/* Icon Alignment Showcase */}
            <div>
              <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-white/40 mb-3 font-semibold">
                3. Alinhamento de Ícones (Left, Right, Icon-Only)
              </h3>
              <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'md')}
                >
                  {CrownIcon} Ícone Esquerda
                </button>
                <button
                  type="button"
                  className={getCombinedClasses(selectedVariant, 'md')}
                >
                  Ícone Direita {ArrowIcon}
                </button>
                <button
                  type="button"
                  className={`${getCombinedClasses(selectedVariant, 'md')} p-3! shrink-0`}
                  title="Icon Only"
                  aria-label="Icon only action"
                >
                  {CrownIcon}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE PLAYGROUND */
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4 lg:col-span-1 border-r border-white/5 pr-0 lg:pr-6">
            <h3
              className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold ${theme.accentText}`}
            >
              Configurações do Botão
            </h3>

            {/* Text Input */}
            <div>
              <label
                htmlFor="interactive-button-text-input"
                className="block text-white/40 text-[10px] uppercase tracking-wider mb-1 font-sans"
              >
                Texto do Botão
              </label>
              <input
                id="interactive-button-text-input"
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className={`w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:${theme.accentBorder}`}
              />
            </div>

            {/* Variant Selector */}
            <div>
              <label
                htmlFor="interactive-button-variant-select"
                className="block text-white/40 text-[10px] uppercase tracking-wider mb-1 font-sans"
              >
                Variante Visual
              </label>
              <select
                id="interactive-button-variant-select"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as any)}
                className={`w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:${theme.accentBorder}`}
              >
                <option value="primary">Primary (Tema Ativo)</option>
                <option value="glass">Secondary Glass</option>
                <option value="outline">Outline Theme</option>
                <option value="destructive">Destructive Red</option>
                <option value="ghost">Ghost Transparent</option>
              </select>
            </div>

            {/* Size Selector */}
            <div>
              <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1 font-sans">
                Tamanho
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['xs', 'sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-1 rounded text-xs uppercase font-mono font-bold border transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                      size === s
                        ? `${theme.primaryGradient}`
                        : 'bg-black/40 text-white/60 border-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Position */}
            <div>
              <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1 font-sans">
                Posição do Ícone
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['none', 'left', 'right', 'only'] as const).map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    onClick={() => setIconPos(pos)}
                    className={`py-1 rounded text-[10px] uppercase font-sans font-bold border transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                      iconPos === pos
                        ? `${theme.primaryGradient}`
                        : 'bg-black/40 text-white/60 border-white/10'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDisabled}
                  onChange={(e) => setIsDisabled(e.target.checked)}
                  className="rounded bg-black/60 border-white/20 focus:ring-0"
                />
                Desabilitado
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLoading}
                  onChange={(e) => setIsLoading(e.target.checked)}
                  className="rounded bg-black/60 border-white/20 focus:ring-0"
                />
                Loading
              </label>
            </div>
          </div>

          {/* Interactive Live Stage */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-black/50 border border-white/5 rounded-xl p-8 items-center min-h-[300px] relative">
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-white/30 self-start">
              Preview do Componente em Tempo Real ({theme.name[lang]})
            </span>

            <div className="my-auto flex items-center justify-center">
              <button
                type="button"
                disabled={isDisabled}
                className={`${getCombinedClasses(selectedVariant, size, isDisabled)} ${iconPos === 'only' ? 'p-3.5! shrink-0' : ''}`}
              >
                {isLoading && SpinnerIcon}
                {!isLoading && iconPos === 'left' && CrownIcon}
                {!isLoading && iconPos === 'only' && CrownIcon}
                {iconPos !== 'only' && buttonText}
                {!isLoading && iconPos === 'right' && ArrowIcon}
              </button>
            </div>

            {/* Copy Classes */}
            <div className="w-full flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-[11px] font-mono text-white/40 truncate max-w-md">
                class="{variantClasses[selectedVariant]} {sizeClasses[size]}"
              </span>
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    `${variantClasses[selectedVariant]} ${sizeClasses[size]}`,
                    'Classes do Botão',
                  )
                }
                className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentBgLight} ${theme.accentText} border ${theme.accentBorder} px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none`}
              >
                Copiar CSS
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
