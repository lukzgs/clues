import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';

export const LayoutMockupsSection: React.FC = () => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [activeMockupTab, setActiveMockupTab] = useState<'join' | 'lobby' | 'gameplay'>('join');
  const [gamePhaseStep, setGamePhaseStep] = useState<'narrator' | 'others' | 'voting' | 'results'>('narrator');

  // Sample cards data for interactive preview
  const sampleHandCards = [
    { id: 1, title: 'O Vento dos Sonhos', color: 'from-purple-900 to-slate-900' },
    { id: 2, title: 'A Torre do Tempo', color: 'from-blue-900 to-indigo-950' },
    { id: 3, title: 'Espelho da Ilusão', color: 'from-slate-900 to-rose-950' },
    { id: 4, title: 'O Guardião Oculto', color: 'from-emerald-950 to-indigo-950' },
  ];

  const [selectedCardId, setSelectedCardId] = useState<number | null>(1);
  const [clueText, setClueText] = useState('Onde os relógios param de derreter');

  return (
    <section id="mockups-layout" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>
            Seção 07
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Páginas Integradas & Previews de Layout Real
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Demonstração interativa dos momentos reais do jogo com a identidade visual do tema ativo <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>

        {/* Mockup Tab Selector */}
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveMockupTab('join')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all ${
              activeMockupTab === 'join' ? `${theme.primaryGradient} shadow-md` : 'text-white/60 hover:text-white'
            }`}
          >
            1. Entrada (Join)
          </button>
          <button
            onClick={() => setActiveMockupTab('lobby')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all ${
              activeMockupTab === 'lobby' ? `${theme.primaryGradient} shadow-md` : 'text-white/60 hover:text-white'
            }`}
          >
            2. Lobby da Sala
          </button>
          <button
            onClick={() => setActiveMockupTab('gameplay')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all ${
              activeMockupTab === 'gameplay' ? `${theme.primaryGradient} shadow-md` : 'text-white/60 hover:text-white'
            }`}
          >
            3. Momentos do Jogo
          </button>
        </div>
      </div>

      {/* MOCKUP 1: JOIN SCREEN */}
      {activeMockupTab === 'join' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
          {/* Ambient Lighting */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
          />
          <div
            className={`absolute top-[20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none z-0 ${theme.ambientOrb}`}
          />

          <div className="w-full max-w-[380px] z-10">
            <div className={`bg-black/50 backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col items-center ${theme.accentBorder}`}>
              {/* Crown Icon */}
              <div className={`mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black/50 ring-1 ring-white/10 ${theme.glowShadow}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
                  <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                  <line x1="2" y1="19" x2="22" y2="19" />
                </svg>
              </div>

              <h3 className="text-3xl font-cinzel text-white mb-1">STORY WEAVER</h3>
              <p className="text-[10px] font-sans text-white/40 uppercase tracking-[0.2em] mb-6">
                DIXIT MULTIPLAYER ONLINE · {theme.badge}
              </p>

              {/* Name Input */}
              <div className="w-full mb-4">
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1 pl-1 font-sans font-medium">
                  Sua Identidade
                </label>
                <input
                  type="text"
                  defaultValue="Narrador Místico"
                  className={`w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-4 py-3 text-white font-cinzel text-base focus:${theme.accentBorder} focus:outline-none`}
                />
              </div>

              {/* Action Buttons */}
              <button className={`w-full font-cinzel font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:scale-[1.02] transition-transform mb-3 ${theme.primaryGradient} ${theme.glowShadow}`}>
                + Criar Nova Sala
              </button>

              <div className="w-full flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] font-sans text-white/30 uppercase tracking-[0.2em]">ou entre em uma sala</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="w-full flex gap-2">
                <input
                  type="text"
                  placeholder="CÓDIGO"
                  maxLength={6}
                  className={`w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-3 py-2.5 text-white font-cinzel text-sm uppercase text-center focus:${theme.accentBorder} focus:outline-none`}
                />
                <button className="bg-white/5 border border-white/10 text-white font-cinzel font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 text-xs hover:bg-white/10 transition-colors shrink-0">
                  Entrar →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOCKUP 2: LOBBY SCREEN */}
      {activeMockupTab === 'lobby' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Options Panel */}
            <div className="lg:w-1/2 bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className={`font-cinzel text-lg font-bold ${theme.accentText}`}>
                  Configurações da Sala
                </h4>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}>
                  HOST: VOCÊ
                </span>
              </div>

              <div className="space-y-3 text-xs font-sans text-white/80">
                <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                  <span>Modo do Baralho</span>
                  <span className={`font-cinzel font-bold ${theme.accentText}`}>Misto (341 Cartas)</span>
                </div>
                <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                  <span>Pontuação Alvo para Vitória</span>
                  <span className={`font-cinzel font-bold ${theme.accentText}`}>30 Pontos</span>
                </div>
                <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                  <span>Temporizador de Rodada</span>
                  <span className="font-cinzel font-bold text-emerald-400">Ativo (60s)</span>
                </div>
              </div>

              <button className={`w-full font-cinzel font-bold uppercase tracking-widest rounded-xl py-3 text-xs hover:scale-[1.01] transition-transform ${theme.primaryGradient} ${theme.glowShadow}`}>
                Iniciar Partida Agora
              </button>
            </div>

            {/* Players Panel */}
            <div className="lg:w-1/2 bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="font-cinzel text-lg text-white font-bold">
                  Jogadores na Sala (4/8)
                </h4>
                <span className="text-[10px] font-sans text-emerald-400 uppercase tracking-widest">
                  Prontos para Jogar
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Você (Narrador)', isHost: true, isBot: false, initial: 'V', color: `${theme.accentBgLight} ${theme.accentBorder} ${theme.accentText}` },
                  { name: 'Sofia Mística', isHost: false, isBot: false, initial: 'S', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
                  { name: 'Lucas_GS', isHost: false, isBot: false, initial: 'L', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                  { name: 'Bot Dixit Alpha', isHost: false, isBot: true, initial: 'B', color: 'bg-sky-500/20 border-sky-500/40 text-sky-300' },
                ].map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {player.isBot ? (
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${player.color}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2" />
                            <circle cx="8.5" cy="16" r="1.5" />
                            <circle cx="15.5" cy="16" r="1.5" />
                            <path d="M12 2v9" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-cinzel font-bold text-xs shrink-0 ${player.color}`}>
                          {player.initial}
                        </div>
                      )}
                      <span className="font-cinzel text-sm text-white font-semibold">{player.name}</span>
                    </div>
                    {player.isHost && (
                      <span className={`text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 rounded border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}>
                        Host
                      </span>
                    )}
                    {player.isBot && (
                      <span className="text-[9px] font-sans uppercase tracking-widest text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        Bot
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOCKUP 3: GAMEPLAY PHASES (DIXIT MOMENTS) */}
      {activeMockupTab === 'gameplay' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Phase Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <span className={`text-xs font-cinzel font-bold uppercase tracking-widest ${theme.accentText}`}>
              Simulador de Momentos do Jogo ({theme.name[lang]}):
            </span>

            <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shrink-0 overflow-x-auto">
              {(['narrator', 'others', 'voting', 'results'] as const).map(step => (
                <button
                  key={step}
                  onClick={() => setGamePhaseStep(step)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-cinzel font-bold uppercase tracking-wider transition-all ${
                    gamePhaseStep === step ? `${theme.primaryGradient}` : 'text-white/60 hover:text-white'
                  }`}
                >
                  {step === 'narrator' && '1. Pista do Narrador'}
                  {step === 'others' && '2. Escolha dos Jogadores'}
                  {step === 'voting' && '3. Fase de Votação'}
                  {step === 'results' && '4. Revelação & Placar'}
                </button>
              ))}
            </div>
          </div>

          {/* PHASE 1: NARRATOR CHOOSING */}
          {gamePhaseStep === 'narrator' && (
            <div className="space-y-5 animate-fade-in">
              <div className={`border rounded-xl p-4 flex items-center justify-between ${theme.accentBgLight} ${theme.accentBorder}`}>
                <div>
                  <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>Você é o Narrador</span>
                  <h4 className="text-lg font-cinzel font-bold text-white">Escolha uma carta da sua mão e digite uma pista enigmática</h4>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono ${theme.accentText}`}>Tempo: 45s</span>
                </div>
              </div>

              {/* Clue Input */}
              <div className="space-y-1.5">
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] pl-1 font-sans">Sua Pista Enigmática</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Digite uma frase ou expressão mística..."
                    className={`flex-1 bg-[#1A1A1A]/80 border border-white/10 rounded-xl px-4 py-3 text-white font-serif text-lg italic focus:outline-none focus:${theme.accentBorder}`}
                  />
                  <button className={`font-cinzel font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform shrink-0 ${theme.primaryGradient} ${theme.glowShadow}`}>
                    Enviar Pista
                  </button>
                </div>
              </div>

              {/* Hand Showcase */}
              <div>
                <span className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 pl-1 font-sans">Cartas da sua Mão</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {sampleHandCards.map(card => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`h-48 rounded-2xl border bg-gradient-to-br ${card.color} p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                        selectedCardId === card.id
                          ? `${theme.accentBorder} ring-2 ring-white/30 -translate-y-2 ${theme.glowShadow}`
                          : 'border-white/10 hover:border-white/30 hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-white/60">#{card.id}</span>
                        {selectedCardId === card.id && (
                          <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.primaryGradient}`}>
                            Selecionada
                          </span>
                        )}
                      </div>
                      <span className={`font-cinzel text-sm font-bold tracking-wide ${theme.accentText}`}>
                        {card.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PHASE 2: OTHERS CHOOSING */}
          {gamePhaseStep === 'others' && (
            <div className="space-y-5 animate-fade-in">
              <div className={`border rounded-xl p-4 ${theme.accentBgLight} ${theme.accentBorder}`}>
                <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>Pista do Narrador Sofia</span>
                <h4 className={`text-xl font-serif italic mt-1 ${theme.accentText}`}>"{clueText}"</h4>
                <p className="text-xs font-sans text-white/60 mt-2">Escolha a carta da sua mão que mais combina com essa pista para enganar os adversários.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {sampleHandCards.map(card => (
                  <div key={card.id} className={`h-44 rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between hover:${theme.accentBorder} hover:-translate-y-1 transition-all cursor-pointer`}>
                    <span className="text-[10px] font-mono text-white/40">Carta #{card.id}</span>
                    <button className={`w-full font-cinzel font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all ${theme.primaryGradient}`}>
                      Jogar Esta
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 3: VOTING PHASE */}
          {gamePhaseStep === 'voting' && (
            <div className="space-y-5 animate-fade-in">
              <div className={`border rounded-xl p-4 text-center ${theme.accentBgLight} ${theme.accentBorder}`}>
                <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>Fase de Votação</span>
                <h4 className={`text-xl font-serif italic mt-1 ${theme.accentText}`}>Pista: "{clueText}"</h4>
                <p className="text-xs font-sans text-white/60 mt-1">Qual destas cartas embaralhadas pertence ao Narrador?</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className={`h-52 rounded-2xl border border-white/20 bg-gradient-to-b from-[#1E1E1E] to-[#0A0A0A] p-4 flex flex-col justify-between hover:${theme.accentBorder} hover:-translate-y-2 transition-all cursor-pointer shadow-lg group`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-cinzel font-bold ${theme.accentText}`}>Opção {idx}</span>
                      <span className="text-[10px] font-sans text-white/30">Mesa</span>
                    </div>
                    <button className={`w-full font-cinzel font-bold text-xs uppercase tracking-widest py-2.5 rounded-xl transition-all ${theme.primaryGradient}`}>
                      Votar Carta {idx}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 4: RESULTS & SCORES */}
          {gamePhaseStep === 'results' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-emerald-400 font-medium">Resultado da Rodada</span>
                  <h4 className="text-lg font-cinzel font-bold text-white">2 Jogadores acertaram a carta do Narrador!</h4>
                </div>
                <button className={`font-cinzel font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl hover:scale-105 transition-transform ${theme.primaryGradient}`}>
                  Próxima Rodada →
                </button>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-3">
                <h5 className={`text-xs font-cinzel font-bold uppercase tracking-wider ${theme.accentText}`}>
                  Placar Geral da Sala
                </h5>
                <div className="space-y-2">
                  {[
                    { rank: '1º', name: 'Sofia Mística', pts: '18 pts', change: '+3 pts' },
                    { rank: '2º', name: 'Você (Narrador)', pts: '15 pts', change: '+3 pts' },
                    { rank: '3º', name: 'Lucas_GS', pts: '12 pts', change: '+0 pts' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1A1A1A]/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-sans">
                      <div className="flex items-center gap-3">
                        <span className={`font-cinzel font-bold text-base ${theme.accentText}`}>{row.rank}</span>
                        <span className="text-white font-medium">{row.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-emerald-400 font-mono font-semibold">{row.change}</span>
                        <span className="font-cinzel font-bold text-white">{row.pts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
