import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeId = 'primary-gold' | 'secondary-glass' | 'eclipse-violet' | 'destructive-red' | 'ghost-mist';

export interface ThemeConfig {
  id: ThemeId;
  name: { pt: string; en: string };
  description: { pt: string; en: string };
  badge: string;
  bgCanvas: string;
  ambientOrb: string;
  primaryGradient: string;
  accentText: string;
  accentBorder: string;
  accentBgLight: string;
  cardBg: string;
  innerCardBg: string;
  inputBg: string;
  secondaryBtnBg: string;
  glowShadow: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'primary-gold': {
    id: 'primary-gold',
    name: { pt: 'Ouro Místico', en: 'Mystic Gold' },
    description: { pt: 'Tema clássico com acentos âmbar dourados e vidros profundos', en: 'Classic theme with amber gold accents and deep glass' },
    badge: 'Amber Gold',
    bgCanvas: '#050505',
    ambientOrb: 'bg-amber-500/15 blur-[160px]',
    primaryGradient: 'bg-gradient-to-r from-amber-200 to-amber-400 text-black',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-500/40',
    accentBgLight: 'bg-amber-500/10',
    cardBg: 'bg-black/35 backdrop-blur-2xl border-white/20 shadow-2xl',
    innerCardBg: 'bg-[#120e07]/45 backdrop-blur-xl border-amber-500/25',
    inputBg: 'bg-[#120e07]/60 backdrop-blur-md border-amber-500/35 text-white placeholder-amber-200/30 focus:border-amber-400 focus:ring-amber-500/30',
    secondaryBtnBg: 'bg-amber-950/40 border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
  'secondary-glass': {
    id: 'secondary-glass',
    name: { pt: 'Cristal Transparente', en: 'Transparent Crystal' },
    description: { pt: 'Tema minimalista em vidro translúcido e reflexos prateados', en: 'Minimalist theme in translucent glass and silver reflections' },
    badge: 'Secondary Glass',
    bgCanvas: '#08080a',
    ambientOrb: 'bg-white/15 blur-[160px]',
    primaryGradient: 'bg-gradient-to-r from-slate-100 to-slate-300 text-black',
    accentText: 'text-white',
    accentBorder: 'border-white/30',
    accentBgLight: 'bg-white/10',
    cardBg: 'bg-white/10 backdrop-blur-3xl border-white/25 shadow-2xl',
    innerCardBg: 'bg-white/5 backdrop-blur-xl border-white/15',
    inputBg: 'bg-white/10 backdrop-blur-md border-white/20 text-white placeholder-white/40 focus:border-white focus:ring-white/30',
    secondaryBtnBg: 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40',
    glowShadow: 'shadow-[0_0_25px_rgba(255,255,255,0.15)]',
  },
  'eclipse-violet': {
    id: 'eclipse-violet',
    name: { pt: 'Eclipse Violeta', en: 'Violet Eclipse' },
    description: { pt: 'Estética mística em tom violeta abissal, néon refinado e fundos cósmicos', en: 'Mystic aesthetic in deep abyssal violet, refined neon and cosmic background' },
    badge: 'Cosmic Purple',
    bgCanvas: '#09040e',
    ambientOrb: 'bg-purple-600/20 blur-[160px]',
    primaryGradient: 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 text-purple-100 font-bold border border-purple-400/30 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:from-purple-700 hover:to-indigo-800',
    accentText: 'text-purple-300',
    accentBorder: 'border-purple-500/40',
    accentBgLight: 'bg-purple-500/10',
    cardBg: 'bg-purple-950/20 backdrop-blur-2xl border-purple-500/25 shadow-2xl',
    innerCardBg: 'bg-[#150a24]/45 backdrop-blur-xl border-purple-500/25',
    inputBg: 'bg-[#180a2b]/60 backdrop-blur-md border-purple-500/35 text-purple-100 placeholder-purple-300/30 focus:border-purple-400 focus:ring-purple-500/30',
    secondaryBtnBg: 'bg-purple-950/40 border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
  },
  'destructive-red': {
    id: 'destructive-red',
    name: { pt: 'Carmim Profundo', en: 'Deep Crimson' },
    description: { pt: 'Estética dramática em tons de carmim, rubi e sombras quentes', en: 'Dramatic aesthetic in crimson, ruby tones and warm shadows' },
    badge: 'Crimson Red',
    bgCanvas: '#0c0404',
    ambientOrb: 'bg-red-600/20 blur-[160px]',
    primaryGradient: 'bg-gradient-to-r from-red-400 to-rose-600 text-white',
    accentText: 'text-red-400',
    accentBorder: 'border-red-500/40',
    accentBgLight: 'bg-red-500/10',
    cardBg: 'bg-red-950/20 backdrop-blur-2xl border-red-500/25 shadow-2xl',
    innerCardBg: 'bg-[#1c0808]/45 backdrop-blur-xl border-red-500/25',
    inputBg: 'bg-[#220909]/60 backdrop-blur-md border-red-500/35 text-red-100 placeholder-red-300/30 focus:border-red-400 focus:ring-red-500/30',
    secondaryBtnBg: 'bg-red-950/40 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
  },
  'ghost-mist': {
    id: 'ghost-mist',
    name: { pt: 'Névoa Etérea', en: 'Ethereal Mist' },
    description: { pt: 'Estética serena em azul-gelo, névoa diáfana e vidro fosco', en: 'Serene aesthetic in ice-blue, diaphanous mist and frosted glass' },
    badge: 'Ghost Mist',
    bgCanvas: '#060709',
    ambientOrb: 'bg-sky-500/15 blur-[160px]',
    primaryGradient: 'bg-gradient-to-r from-sky-200 to-indigo-300 text-black',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-500/30',
    accentBgLight: 'bg-sky-500/10',
    cardBg: 'bg-slate-900/25 backdrop-blur-3xl border-sky-400/20 shadow-2xl',
    innerCardBg: 'bg-[#0c141c]/45 backdrop-blur-xl border-sky-500/20',
    inputBg: 'bg-[#0e1824]/60 backdrop-blur-md border-sky-500/30 text-sky-100 placeholder-sky-300/30 focus:border-sky-400 focus:ring-sky-500/30',
    secondaryBtnBg: 'bg-sky-950/40 border-sky-500/30 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(56,189,248,0.2)]',
  },
};

interface ThemeContextType {
  activeThemeId: ThemeId;
  theme: ThemeConfig;
  setTheme: (id: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('primary-gold');

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setActiveThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ activeThemeId, theme: THEMES[activeThemeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      activeThemeId: 'primary-gold' as ThemeId,
      theme: THEMES['primary-gold'],
      setTheme: () => {},
    };
  }
  return context;
};
