import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import {
  THEMES,
  type ThemeId,
  ThemeProvider,
  useTheme,
} from '../../providers/ThemeProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import { Button } from '../ui/Button';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ButtonMatrixSection } from './ButtonMatrixSection';
import { ColorSwatch } from './ColorSwatch';
import { DataCardsSection } from './DataCardsSection';
import { FeedbackSection } from './FeedbackSection';
import { FormsSection } from './FormsSection';
import { LayoutMockupsSection } from './LayoutMockupsSection';
import { TypographySection } from './TypographySection';

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface DesignSystemScreenProps {
  onBackToApp?: () => void;
}

const DesignSystemContent: React.FC<DesignSystemScreenProps> = ({
  onBackToApp,
}) => {
  const { activeThemeId, theme, setTheme } = useTheme();
  const { lang, t } = useTranslation();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add Toast Notification
  const addToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Copy helper with Toast feedback
  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    addToast('success', `Copiado: ${label}`);
  };

  // Smooth Scroll Helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Swatches data based on active theme
  const colorSwatches = [
    {
      name: 'App Canvas',
      category: 'Fundo da Aplicação',
      hex: theme.bgCanvas,
      rgb: theme.bgCanvas,
      twClass: `bg-[${theme.bgCanvas}]`,
    },
    {
      name: 'Glass Card',
      category: 'Superfície Principal',
      hex: 'rgba(0,0,0,0.4)',
      rgb: 'rgba(0,0,0,0.4)',
      twClass: theme.cardBg,
    },
    {
      name: 'Modal Overlay',
      category: 'Superfície de Diálogo',
      hex: 'rgba(0,0,0,0.8)',
      rgb: 'rgba(0,0,0,0.8)',
      twClass: 'bg-black/80 backdrop-blur-md',
    },
    {
      name: theme.name[lang],
      category: 'Acento Primário do Tema',
      hex: '#fbbf24',
      rgb: 'rgb(251, 191, 36)',
      twClass: theme.primaryGradient,
      textColor: 'text-black',
    },
    {
      name: 'Acento de Borda',
      category: 'Bordas e Destaques',
      hex: 'Theme Border',
      rgb: 'Theme Border',
      twClass: `${theme.accentBorder} bg-black/40`,
    },
    {
      name: 'Emerald',
      category: 'Semântica: Sucesso',
      hex: '#10b981',
      rgb: 'rgb(16, 185, 129)',
      twClass: 'bg-emerald-500',
    },
    {
      name: 'Amber Alert',
      category: 'Semântica: Alerta',
      hex: '#f59e0b',
      rgb: 'rgb(245, 158, 11)',
      twClass: 'bg-amber-500',
      textColor: 'text-black',
    },
    {
      name: 'Crimson',
      category: 'Semântica: Erro',
      hex: '#ef4444',
      rgb: 'rgb(239, 68, 68)',
      twClass: 'bg-red-500',
    },
    {
      name: 'Sky Info',
      category: 'Semântica: Informação',
      hex: '#38bdf8',
      rgb: 'rgb(56, 189, 248)',
      twClass: 'bg-sky-400',
      textColor: 'text-black',
    },
    {
      name: 'Texto Título',
      category: 'Hierarquia de Texto',
      hex: '#fef3c7',
      rgb: 'rgb(254, 243, 199)',
      twClass: theme.accentText,
      textColor: 'text-black',
    },
    {
      name: 'Texto Corpo',
      category: 'Hierarquia de Texto',
      hex: 'rgba(255,255,255,0.8)',
      rgb: 'rgba(255,255,255,0.8)',
      twClass: 'bg-white/80',
      textColor: 'text-black',
    },
    {
      name: 'Texto Rótulo',
      category: 'Hierarquia de Texto',
      hex: 'rgba(255,255,255,0.4)',
      rgb: 'rgba(255,255,255,0.4)',
      twClass: 'bg-white/40',
      textColor: 'text-black',
    },
  ];

  const sectionsList = [
    { id: 'cores', title: '01. Cores & Superfícies' },
    { id: 'tipografia', title: '02. Tipografia' },
    { id: 'botoes', title: '03. Botões & Ações' },
    { id: 'formularios', title: '04. Formulários & Inputs' },
    { id: 'cards-metricas', title: '05. Cards Reais das Telas' },
    { id: 'feedback-alertas', title: '06. Feedback & Toasts' },
    { id: 'mockups-layout', title: '07. Previews de Layout' },
  ];

  return (
    <div
      style={{ backgroundColor: theme.bgCanvas }}
      className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black relative pb-20 transition-colors duration-500 custom-scrollbar"
    >
      {/* AMBIENT LIGHTING BACKGROUND */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)',
        }}
      />
      <div
        className={`fixed top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0 transition-all duration-700 ${theme.ambientOrb}`}
      />

      {/* FLOATING TOAST CONTAINER */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 animate-slide-in-from-right transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                  : toast.type === 'error'
                    ? 'bg-red-950/90 border-red-500/40 text-red-200'
                    : 'bg-sky-950/90 border-sky-500/40 text-sky-200'
            }`}
          >
            <span className="text-xs font-sans font-medium">
              {toast.message}
            </span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="opacity-60 hover:opacity-100 transition-opacity text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 1. REORGANIZED STICKY HEADER WITH RESTRUCTURED THEME SELECTOR & LANGUAGE SWITCHER */}
      <header className="sticky top-0 z-40 bg-black/75 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo Crown */}
            <div
              className={`w-10 h-10 rounded-full border border-white/20 bg-black/50 ring-1 ring-white/10 flex items-center justify-center shadow-lg shrink-0 ${theme.glowShadow}`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={theme.accentText}
              >
                <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                <line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-cinzel font-bold text-white tracking-wide">
                  STORY WEAVER
                </h1>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}
                >
                  {theme.badge}
                </span>
              </div>
              <p className="text-[10px] font-sans text-white/40 uppercase tracking-[0.2em] hidden sm:block">
                {t.sysd.subtitle}
              </p>
            </div>
          </div>

          {/* DOCK UNIFICADO DE SELEÇÃO DE TEMAS */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 p-1.5 rounded-2xl overflow-x-auto max-w-full custom-scrollbar">
            <span className="text-[9px] font-sans uppercase tracking-widest text-white/40 font-bold px-2 hidden sm:inline">
              Tema:
            </span>
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const themeItem = THEMES[id];
              const isActive = activeThemeId === id;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  title={themeItem.description[lang]}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-cinzel font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? `${themeItem.primaryGradient} shadow-md scale-[1.02]`
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full border border-white/20 ${isActive ? 'bg-white' : 'bg-white/40'}`}
                  />
                  {themeItem.name[lang]}
                </button>
              );
            })}
          </div>

          {/* Controles de Idioma e Retorno */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle className="relative! top-auto! right-auto! z-auto!" />
            <Button
              variant="primary"
              size="sm"
              onClick={onBackToApp || (() => (window.location.href = '/'))}
            >
              <span>{t.sysd.returnToApp}</span>
            </Button>
          </div>
        </div>

        {/* 2. QUICK-JUMP NAVIGATION BAR */}
        <div className="bg-black/50 border-t border-white/5 overflow-x-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center gap-2 whitespace-nowrap">
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`text-xs font-cinzel font-bold text-white/60 hover:bg-white/5 border border-transparent hover:border-white/10 px-3 py-1.5 rounded-lg transition-all hover:${theme.accentText}`}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-16 relative z-10">
        {/* HERO / WELCOME BANNER WITH ACTIVE THEME DETAILS */}
        <div
          className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-500 ${theme.cardBg} ${theme.accentBorder}`}
        >
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-sans uppercase tracking-[0.25em] font-semibold px-3 py-1 rounded-full border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}
              >
                {t.sysd.activeTheme}: {theme.name[lang]}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-white tracking-tight">
              {t.sysd.title}
            </h2>
            <p className="text-sm font-sans text-white/70 leading-relaxed">
              {theme.description[lang]}. Todos os componentes, tipografias,
              inputs, botões, modais e cards estáticos estão unificados e
              atualizados nesta fonte de verdade.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() =>
                handleCopy(
                  JSON.stringify(colorSwatches, null, 2),
                  'Tokens do Tema JSON',
                )
              }
              className="bg-black/60 hover:bg-black/80 border border-white/10 text-white font-cinzel font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              {t.sysd.copyThemeTokens}
            </button>
          </div>
        </div>

        {/* SECTION 1: CORES & SUPERFÍCIES */}
        <section id="cores" className="scroll-mt-28 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span
                className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}
              >
                Seção 01
              </span>
              <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
                {t.sysd.sec1Title}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colorSwatches.map((swatch, idx) => (
              <ColorSwatch
                key={idx}
                name={swatch.name}
                category={swatch.category}
                hex={swatch.hex}
                rgb={swatch.rgb}
                twClass={swatch.twClass}
                textColor={swatch.textColor}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: TIPOGRAFIA & FONTES */}
        <TypographySection onCopy={handleCopy} />

        {/* SECTION 3: BOTÕES & AÇÕES */}
        <ButtonMatrixSection onCopy={handleCopy} />

        {/* SECTION 4: FORMULÁRIOS & INPUTS */}
        <FormsSection onCopy={handleCopy} />

        {/* SECTION 5: CARDS REAIS DAS TELAS */}
        <DataCardsSection onCopy={handleCopy} />

        {/* SECTION 6: FEEDBACK & TOAST SYSTEM */}
        <FeedbackSection onTriggerToast={addToast} />

        {/* SECTION 7: PREVIEWS DE LAYOUT REAL */}
        <LayoutMockupsSection />
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-white/40">
        <p>STORY WEAVER © 2026 — Design System & Style Showcase</p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`hover:${theme.accentText} transition-colors uppercase tracking-widest font-bold font-cinzel`}
        >
          ▲ {t.sysd.backToTop}
        </button>
      </footer>
    </div>
  );
};

export const DesignSystemScreen: React.FC<DesignSystemScreenProps> = (
  props,
) => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DesignSystemContent {...props} />
      </ToastProvider>
    </ThemeProvider>
  );
};
