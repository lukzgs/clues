import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';

interface DataCardsSectionProps {
  onCopy: (value: string, label: string) => void;
}

export const DataCardsSection: React.FC<DataCardsSectionProps> = ({ onCopy }) => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statsData = [
    {
      title: 'Taxa de Acerto do Narrador',
      value: '68.4%',
      change: '+12.5%',
      isPositive: true,
      category: 'Estatística de Gameplay',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      title: 'Pontuação Média da Sala',
      value: '24.8 pts',
      change: '+4.2%',
      isPositive: true,
      category: 'Desempenho Geral',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      title: 'Tempo Médio por Rodada',
      value: '38s',
      change: '-8.1%',
      isPositive: false,
      category: 'Velocidade de Jogo',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
          <path d="M22 12A10 10 0 1 1 12 2v10z" />
        </svg>
      ),
    },
    {
      title: 'Partidas Concluídas',
      value: '1,420',
      change: '+24.0%',
      isPositive: true,
      category: 'Métrica de Uso',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
  ];

  return (
    <section id="cards-metricas" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>
            Seção 05
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Exibição de Dados & Cards de Métricas
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Cartões de métricas estatísticas e diálogos modais de confirmação estilizados com o tema <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>

        {/* Trigger Modal Preview */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`font-cinzel font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shrink-0 ${theme.primaryGradient} ${theme.glowShadow}`}
        >
          Testar Modal ({theme.name[lang]})
        </button>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-black/30 border border-white/10 rounded-2xl p-5 hover:${theme.accentBorder} transition-all duration-300 flex flex-col justify-between group`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-white/40 font-medium">
                  {stat.category}
                </span>
                <div className={`w-9 h-9 rounded-full ${theme.accentBgLight} border ${theme.accentBorder} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
              </div>

              <h4 className="text-sm font-sans font-medium text-white/80 line-clamp-1">
                {stat.title}
              </h4>

              <div className="text-3xl font-cinzel font-bold text-white tracking-wide mt-2">
                {stat.value}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span
                className={`inline-flex items-center text-xs font-sans font-bold px-2 py-0.5 rounded-full border ${
                  stat.isPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {stat.isPositive ? '↑' : '↓'} {stat.change}
              </span>

              <button
                onClick={() => onCopy(`${stat.title}: ${stat.value} (${stat.change})`, 'Card de Métrica')}
                className={`text-[9px] font-sans uppercase tracking-widest text-white/30 hover:${theme.accentText} transition-colors`}
              >
                Copiar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SAMPLE MODAL PREVIEW (OVERLAY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md border ring-1 ring-white/10 shadow-2xl rounded-2xl p-6 md:p-8 relative space-y-5 animate-zoom-in ${theme.cardBg} ${theme.accentBorder}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${theme.accentBgLight} border ${theme.accentBorder} flex items-center justify-center font-bold ${theme.accentText}`}>
                  !
                </div>
                <h3 className="text-xl font-cinzel font-bold text-white">
                  Reiniciar Partida?
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <p className="text-sm font-sans text-white/70 leading-relaxed">
              Tem certeza que deseja reiniciar o jogo? Todos os pontos acumulados pelos jogadores nesta sala serão zerados e o baralho será reembaralhado.
            </p>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-white/5 border border-white/10 text-white font-cinzel font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`flex-1 font-cinzel font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:scale-[1.02] transition-transform ${theme.primaryGradient} ${theme.glowShadow}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
