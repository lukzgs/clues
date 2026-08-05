import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';

interface FormsSectionProps {
  onCopy: (value: string, label: string) => void;
}

export const FormsSection: React.FC<FormsSectionProps> = () => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [inputText, setInputText] = useState('Narrador123');
  const [selectValue, setSelectValue] = useState('mixed');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [radioSelected, setRadioSelected] = useState('score');
  const [switchOn, setSwitchOn] = useState(true);
  const [textareaValue, setTextareaValue] = useState('Uma pista misteriosa envolvendo sonhos e ilusões antigas...');

  return (
    <section id="formularios" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>
            Seção 04
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Formulários & Inputs
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Elementos de formulário adaptados ao tema ativo <strong className={theme.accentText}>{theme.name[lang]}</strong>, com estados de foco, sucesso e erro proeminentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: TEXT INPUTS & VALIDATION STATES */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}>
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
              className={`w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:${theme.accentBorder} focus:bg-[#1A1A1A]/80 focus:ring-1 transition-all font-cinzel text-lg`}
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
                className={`w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl pl-4 pr-11 py-3.5 text-white placeholder-white/20 focus:outline-none focus:${theme.accentBorder} focus:ring-1 transition-all font-cinzel text-lg`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:${theme.accentText} transition-colors p-1`}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
            <p className="text-[10px] text-emerald-400/90 font-sans tracking-wide pl-1">
              Código verificado e disponível para entrada.
            </p>
          </div>

          {/* Error Validation State */}
          <div className="space-y-1.5">
            <label className="block text-red-400/80 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Código da Sala (Estado de Erro)
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="INVALID"
                className="w-full bg-red-950/30 border border-red-500/60 rounded-xl px-4 py-3.5 text-red-200 font-cinzel text-lg focus:outline-none ring-1 ring-red-500/40"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 font-bold">
                ✕
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400 text-[10px] uppercase tracking-[0.15em] font-sans font-medium pl-1 pt-0.5">
              <span>Código de sala inválido ou inexistente.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECT, CHECKBOX, RADIO, TEXTAREA & SWITCH */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}>
            2. Controles de Seleção & Opções
          </h3>

          {/* Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
              Modo do Baralho (Custom Select)
            </label>
            <select
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              className={`w-full bg-[#1A1A1A]/80 border border-white/10 rounded-xl px-4 py-3.5 text-white font-cinzel text-base focus:outline-none focus:${theme.accentBorder}`}
            >
              <option value="mixed" className="bg-[#1A1A1A] text-white">Baralho Misto (341 Cartas)</option>
              <option value="classic" className="bg-[#1A1A1A] text-white">Edição Clássica Dixit</option>
              <option value="surreal" className="bg-[#1A1A1A] text-white">Expansão Surrealismo</option>
            </select>
          </div>

          {/* Textarea with Character Counter */}
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
              className={`w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl p-3.5 text-white text-sm font-sans focus:outline-none focus:${theme.accentBorder} resize-none`}
            />
          </div>

          {/* Radio Buttons & Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Radio Group */}
            <div className="space-y-2">
              <span className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
                Condição de Vitória (Radio)
              </span>
              <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-3">
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer font-sans">
                  <input
                    type="radio"
                    name="victoryCond"
                    value="score"
                    checked={radioSelected === 'score'}
                    onChange={() => setRadioSelected('score')}
                    className="focus:ring-0 bg-black/60 border-white/20"
                  />
                  Pontuação Alvo (30 pts)
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer font-sans">
                  <input
                    type="radio"
                    name="victoryCond"
                    value="rounds"
                    checked={radioSelected === 'rounds'}
                    onChange={() => setRadioSelected('rounds')}
                    className="focus:ring-0 bg-black/60 border-white/20"
                  />
                  Limite de Rodadas
                </label>
              </div>
            </div>

            {/* Checkbox & Switch */}
            <div className="space-y-2">
              <span className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans font-medium">
                Toggles & Opções
              </span>
              <div className="space-y-3 bg-black/40 border border-white/5 rounded-xl p-3">
                <label className="flex items-center justify-between text-xs text-white/80 cursor-pointer font-sans">
                  <span>Permitir Bots</span>
                  <input
                    type="checkbox"
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                    className="rounded focus:ring-0 bg-black/60 border-white/20"
                  />
                </label>

                <div className="flex items-center justify-between text-xs text-white/80 font-sans border-t border-white/5 pt-2">
                  <span>Temporizador Ativo</span>
                  <button
                    type="button"
                    onClick={() => setSwitchOn(!switchOn)}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                      switchOn ? `${theme.primaryGradient}` : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        switchOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
