import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';

interface FormsSectionProps {
  onCopy: (value: string, label: string) => void;
}

export const FormsSection: React.FC<FormsSectionProps> = () => {
  const { theme } = useTheme();
  const { lang } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [inputText, setInputText] = useState('Narrador123');
  const [deckOption, setDeckOption] = useState<'original' | 'new' | 'mixed'>(
    'mixed',
  );
  const [targetScore, setTargetScore] = useState(30);
  const [scoreEnabled, setScoreEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeoutNarrator, setTimeoutNarrator] = useState(60);
  const [textareaValue, setTextareaValue] = useState(
    'Uma pista misteriosa envolvendo sonhos e ilusões antigas...',
  );

  return (
    <section id="formularios" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span
            className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}
          >
            Seção 04
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Formulários & Inputs
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Elementos de formulário e componentes de controle interativos fiéis
            ao Lobby e adaptados ao tema{' '}
            <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: TEXT INPUTS & VALIDATION STATES */}
        <div
          className={`border rounded-2xl p-6 space-y-6 transition-all duration-500 ${theme.innerCardBg}`}
        >
          <h3
            className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}
          >
            1. Entradas de Texto & Validação
          </h3>

          {/* Default / Focused Input */}
          <div className="space-y-1.5">
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Identidade do Jogador (Padrão)
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite seu apelido..."
              className={`w-full rounded-xl px-4 py-3.5 outline-none ring-1 ring-white/5 transition-all font-cinzel text-lg ${theme.inputBg}`}
            />
          </div>

          {/* Password with Eye Toggle */}
          <div className="space-y-1.5">
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Senha Secreta da Sala (Com Alternância)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                defaultValue="Clues2026Secret"
                className={`w-full rounded-xl pl-4 pr-11 py-3.5 outline-none ring-1 ring-white/5 transition-all font-cinzel text-lg ${theme.inputBg}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:${theme.accentText} transition-colors p-1`}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Textarea for Clue */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1">
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                Pista do Narrador (Textarea)
              </label>
              <span className="text-[10px] font-mono text-white/40">
                {textareaValue.length}/100
              </span>
            </div>
            <textarea
              rows={3}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value.slice(0, 100))}
              className={`w-full rounded-xl p-3.5 text-sm font-sans outline-none ring-1 ring-white/5 resize-none transition-all ${theme.inputBg}`}
            />
          </div>

          {/* Success Validation State */}
          <div className="space-y-1.5">
            <label className="block text-emerald-400/80 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Código da Sala (Validação OK)
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="ROOM99"
                className="w-full bg-emerald-950/20 border border-emerald-500/50 rounded-xl px-4 py-3.5 text-emerald-200 font-cinzel text-lg focus:outline-none ring-1 ring-emerald-500/30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">
                ✓
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL LOBBY COMPONENTS & CONTROLS */}
        <div
          className={`border rounded-2xl p-6 space-y-6 transition-all duration-500 ${theme.innerCardBg}`}
        >
          <h3
            className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}
          >
            2. Controles de Seleção & Opções do Lobby
          </h3>

          {/* Deck Selection Pills Switcher */}
          <div className="space-y-2">
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Seleção de Baralho (Pill Switcher)
            </label>
            <div
              className={`flex border rounded-xl p-1 relative z-0 transition-all duration-300 ${theme.innerCardBg}`}
            >
              <div
                className={`absolute inset-y-1 rounded-lg transition-all duration-300 z-[-1] ${theme.accentBgLight} border ${theme.accentBorder}`}
                style={{
                  width: 'calc(33.333% - 4px)',
                  left:
                    deckOption === 'original'
                      ? '4px'
                      : deckOption === 'new'
                        ? 'calc(33.333% + 2px)'
                        : 'calc(66.666%)',
                }}
              />
              {(['original', 'new', 'mixed'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setDeckOption(option)}
                  className={`flex-1 py-2 text-[10px] md:text-xs font-cinzel font-bold tracking-widest transition-colors duration-200 uppercase rounded-lg ${
                    deckOption === option
                      ? theme.accentText
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {option === 'original'
                    ? 'Original'
                    : option === 'new'
                      ? 'Novo'
                      : 'Misto'}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Card with Switch & Range Slider */}
          <div className="space-y-2">
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Card de Regra com Switch & Range Slider
            </label>
            <div
              className={`rounded-2xl border transition-all duration-300 ${
                scoreEnabled
                  ? `${theme.innerCardBg} ${theme.accentBorder}`
                  : 'bg-black/20 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between p-3 pb-2">
                <span
                  className={`text-xs md:text-sm font-cinzel font-bold tracking-wider ${scoreEnabled ? 'text-white' : 'text-white/30'}`}
                >
                  Por Pontuação Alvo
                </span>
                <button
                  onClick={() => setScoreEnabled(!scoreEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                    scoreEnabled ? theme.primaryGradient : 'bg-white/10'
                  }`}
                  aria-label="Toggle score condition"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                      scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {scoreEnabled && (
                <div className="px-3 pb-3 pt-0.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-sans font-bold">
                      Primeiro a Atingir
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        max={100}
                        step={5}
                        value={targetScore}
                        onChange={(e) => setTargetScore(Number(e.target.value))}
                        className={`w-14 rounded-lg px-1.5 py-1 ${theme.inputBg} font-cinzel font-bold text-sm text-center tabular-nums outline-none`}
                      />
                      <span className="text-white/30 text-[9px] font-sans font-bold uppercase">
                        PTS
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                    style={{ accentColor: 'currentColor' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Phase Timeout Control Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                Temporizador de Fase (Card + Slider)
              </label>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`relative w-9 h-4.5 rounded-full transition-colors duration-300 ${
                  timerEnabled ? theme.primaryGradient : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-300 ${
                    timerEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {timerEnabled && (
              <div
                className={`border rounded-xl p-3 space-y-2 transition-all duration-300 ${theme.innerCardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-cinzel font-bold text-white/80">
                    Fase 1: Escolha do Narrador
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      step={1}
                      value={timeoutNarrator}
                      onChange={(e) =>
                        setTimeoutNarrator(Number(e.target.value))
                      }
                      className={`w-14 rounded-lg px-1.5 py-1 ${theme.inputBg} font-cinzel font-bold text-sm text-center tabular-nums outline-none`}
                    />
                    <span className="text-white/30 text-[9px] font-sans font-bold uppercase">
                      SEG
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={1}
                  value={timeoutNarrator}
                  onChange={(e) => setTimeoutNarrator(Number(e.target.value))}
                  className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                  style={{ accentColor: 'currentColor' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
