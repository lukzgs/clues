import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';
import { Button } from '../ui/Button';

interface DataCardsSectionProps {
  onCopy: (value: string, label: string) => void;
}

export const DataCardsSection: React.FC<DataCardsSectionProps> = ({ onCopy }) => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<number | null>(42);

  return (
    <section id="cards-metricas" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>
            Seção 05
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Exibição de Dados & Cards de Métricas (Composição de Telas)
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Exibição completa dos cards utilizados nas telas da aplicação para inspecionar fontes, tamanhos, componentes e harmonia de cores no tema <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>

        {/* Trigger Modal Preview */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="shrink-0"
        >
          Testar Modal ({theme.name[lang]})
        </Button>
      </div>

      {/* SHOWCASE GRID 1: REAL SCREEN CARDS FOR COLOR & TYPOGRAPHY INSPECTION */}
      <div className="space-y-6">
        <h3 className={`text-xs font-sans uppercase tracking-[0.2em] font-bold border-b border-white/5 pb-2 ${theme.accentText}`}>
          1. Matriz de Cards Principais do Aplicativo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: Game Options Card (Lobby) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: GameOptions (Lobby)
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}>
                Host Only
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-cinzel font-bold text-sm text-white">Pontuação Alvo</span>
                <span className={`font-mono font-bold text-xs ${theme.accentText}`}>30 PTS</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                defaultValue={30}
                className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                style={{ accentColor: 'currentColor' }}
              />
            </div>

            <Button variant="primary" size="sm" className="w-full">
              Salvar Ajustes
            </Button>
          </div>

          {/* CARD 2: Player Card (Lobby / Sidebar) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: PlayerCard (Lobby)
              </span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-emerald-400">
                Ativo
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${theme.accentBgLight} ${theme.accentBorder}`}>
              <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black font-cinzel font-bold text-sm shrink-0 shadow-lg">
                N
              </div>
              <div className="flex-1 min-w-0">
                <span className={`font-cinzel font-bold text-xs block truncate ${theme.accentText}`}>
                  Narrador Místico
                </span>
                <span className="text-white/40 text-[10px] font-sans uppercase tracking-wider block">
                  Host da Sala
                </span>
              </div>
              <div className={`w-6 h-6 flex items-center justify-center rounded-lg border ${theme.accentBgLight} ${theme.accentBorder} ${theme.accentText} shrink-0`}>
                👑
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="glass" size="xs" className="flex-1">
                Tornar Espectador
              </Button>
              <Button variant="destructive" size="xs" className="shrink-0">
                Expulsar
              </Button>
            </div>
          </div>

          {/* CARD 3: Dixit Hand Card (Gameplay) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: DixitHand (Mão do Jogo)
              </span>
              <span className="text-[9px] font-mono text-white/40">#CARD_042</span>
            </div>

            <div
              onClick={() => setSelectedHandCard(selectedHandCard === 42 ? null : 42)}
              className={`h-40 rounded-xl border bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                selectedHandCard === 42
                  ? `${theme.accentBorder} ring-2 ring-white/40 -translate-y-1 ${theme.glowShadow}`
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/60">Carta #42</span>
                {selectedHandCard === 42 && (
                  <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.primaryGradient}`}>
                    Selecionada
                  </span>
                )}
              </div>
              <span className={`font-cinzel text-sm font-bold tracking-wide ${theme.accentText}`}>
                O Guardião das Sombras
              </span>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              Confirmar Escolha
            </Button>
          </div>

          {/* CARD 4: Table Voting Card (Voting Phase) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: TableVoting (Mesa)
              </span>
              <span className="text-[9px] font-sans uppercase text-sky-300">Votação</span>
            </div>

            <div className="h-36 rounded-xl border border-white/20 bg-gradient-to-b from-[#1E1E1E] to-[#0A0A0A] p-4 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center">
                <span className={`text-xs font-cinzel font-bold ${theme.accentText}`}>Carta da Mesa 2</span>
                <span className="text-[10px] font-sans text-white/40">Embaralhada</span>
              </div>
              <span className="text-xs font-serif italic text-white/70">"Pista: Onde os relógios derretem"</span>
            </div>

            <Button variant="primary" size="sm" className="w-full">
              Votar Nesta Carta
            </Button>
          </div>

          {/* CARD 5: Leaderboard Row Card (Results Phase) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: ScoreboardRow (Placar)
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">+3 PTS</span>
            </div>

            <div className="space-y-2">
              {[
                { rank: '1º', name: 'Sofia Mística', pts: '18 pts', isMe: false },
                { rank: '2º', name: 'Você (Narrador)', pts: '15 pts', isMe: true },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    row.isMe ? `${theme.accentBgLight} ${theme.accentBorder}` : `${theme.innerCardBg} border-white/10`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-cinzel font-bold text-sm ${theme.accentText}`}>{row.rank}</span>
                    <span className="text-xs font-cinzel font-bold text-white">{row.name}</span>
                  </div>
                  <span className="font-cinzel font-bold text-xs text-white">{row.pts}</span>
                </div>
              ))}
            </div>

            <Button variant="glass" size="xs" className="w-full">
              Ver Detalhes dos Votos
            </Button>
          </div>

          {/* CARD 6: Winner Podium Card (Game Over) */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-500 ${theme.innerCardBg} ${theme.accentBorder}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                Card: WinnerPodium (GameOver)
              </span>
              <span className={`text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}>
                Vencedor
              </span>
            </div>

            <div className={`p-4 rounded-xl border text-center space-y-2 ${theme.accentBgLight} ${theme.accentBorder}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 text-black mx-auto flex items-center justify-center font-cinzel font-bold text-xl shadow-lg">
                🥇
              </div>
              <h4 className={`font-cinzel font-bold text-base ${theme.accentText}`}>
                Sofia Mística
              </h4>
              <p className="text-xs font-sans text-white/70">
                Campeã da Partida com <strong>32 Pontos</strong>
              </p>
            </div>

            <Button variant="primary" size="sm" className="w-full">
              Jogar Novamente
            </Button>
          </div>
        </div>
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
              <Button
                variant="glass"
                size="md"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
