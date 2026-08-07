import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';
import { Button } from '../ui/Button';
import { RoomCodeDisplay } from '../screens/lobby/RoomCodeDisplay';

export const LayoutMockupsSection: React.FC = () => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [activeMockupTab, setActiveMockupTab] = useState<'join' | 'lobby' | 'gameplay'>('lobby');
  const [gamePhaseStep, setGamePhaseStep] = useState<'narrator' | 'others' | 'voting' | 'results'>('narrator');
  const [deckOption, setDeckOption] = useState<'original' | 'new' | 'mixed'>('mixed');
  const [scoreEnabled, setScoreEnabled] = useState(true);

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
            Demonstração interativa das telas do jogo e dos cards do Lobby com a combinação de cores do tema <strong className={theme.accentText}>{theme.name[lang]}</strong>.
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
            <div className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col items-center ${theme.cardBg} ${theme.accentBorder}`}>
              {/* Crown Icon */}
              <div className={`mb-4 flex items-center justify-center w-12 h-12 rounded-full border bg-black/50 ring-1 ring-white/10 ${theme.accentBgLight} ${theme.accentBorder} ${theme.glowShadow}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={theme.accentText}>
                  <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                  <line x1="2" y1="19" x2="22" y2="19" />
                </svg>
              </div>

              <h3 className="text-3xl font-cinzel text-white mb-1 font-bold">STORY WEAVER</h3>
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
                  className={`w-full rounded-xl px-4 py-3 font-cinzel text-base outline-none ${theme.inputBg}`}
                />
              </div>

              {/* Action Buttons */}
              <Button variant="primary" size="md" className="w-full mb-3">
                + Criar Nova Sala
              </Button>

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
                  className={`flex-1 rounded-xl px-3 py-2.5 font-cinzel text-sm uppercase text-center outline-none ${theme.inputBg}`}
                />
                <Button variant="glass" size="sm" className="shrink-0 px-4">
                  Entrar →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOCKUP 2: LOBBY SCREEN (CARDS & OPTIONS SHOWCASE) */}
      {activeMockupTab === 'lobby' && (
        <div className={`backdrop-blur-2xl border border-white/10 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-500 ${theme.cardBg}`}>
          
          {/* Real Lobby Room Code Display */}
          <div className="border-b border-white/10 pb-4 mb-6">
            <RoomCodeDisplay roomCode="ROOM99" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Game Options */}
            <div className={`border rounded-2xl p-5 md:p-6 space-y-5 transition-all duration-500 ${theme.innerCardBg}`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className={`font-cinzel text-base font-bold tracking-wider ${theme.accentText}`}>
                  Opções da Partida (GameOptions)
                </h4>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg border font-bold ${theme.accentBgLight} ${theme.accentText} border-white/10`}>
                  HOST
                </span>
              </div>

              {/* Score condition card */}
              <div className={`rounded-xl border p-3.5 space-y-3 transition-all duration-300 ${theme.innerCardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="font-cinzel font-bold text-sm text-white">Por Pontuação Alvo</span>
                  <button
                    onClick={() => setScoreEnabled(!scoreEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                      scoreEnabled ? theme.primaryGradient : 'bg-white/10'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                      scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                {scoreEnabled && (
                  <div className="space-y-2 pt-1 border-t border-white/5">
                    <div className="flex justify-between text-xs text-white/60 font-sans">
                      <span>Primeiro a atingir 30 pontos</span>
                      <span className={`font-mono font-bold ${theme.accentText}`}>30 PTS</span>
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
                )}
              </div>

              {/* Deck Selection Pills */}
              <div className="space-y-2">
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-bold">
                  Seleção de Baralho (Deck Option)
                </label>
                <div className={`flex border rounded-xl p-1 relative z-0 transition-all duration-300 ${theme.innerCardBg}`}>
                  <div
                    className={`absolute inset-y-1 rounded-lg transition-all duration-300 z-[-1] ${theme.accentBgLight} border ${theme.accentBorder}`}
                    style={{
                      width: 'calc(33.333% - 4px)',
                      left: deckOption === 'original' ? '4px' : deckOption === 'new' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                    }}
                  />
                  {(['original', 'new', 'mixed'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setDeckOption(option)}
                      className={`flex-1 py-2 text-xs font-cinzel font-bold tracking-widest transition-colors uppercase rounded-lg ${
                        deckOption === option ? theme.accentText : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      {option === 'original' ? 'Original' : option === 'new' ? 'Novo' : 'Misto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons using SysD Button */}
              <div className="space-y-2.5 pt-2">
                <Button variant="primary" size="md" className="w-full">
                  Iniciar Partida Agora
                </Button>
                <Button variant="outline" size="md" className="w-full">
                  + Adicionar Bot
                </Button>
              </div>
            </div>

            {/* Right Panel: Player List Cards */}
            <div className={`border rounded-2xl p-5 md:p-6 space-y-5 transition-all duration-500 ${theme.innerCardBg}`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-cinzel text-base font-bold text-white tracking-wider">
                  Jogadores na Sala (Player Cards)
                </h4>
                <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${theme.accentText}`}>
                  4 / 8 Conectados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Você (Host)', isHost: true, isBot: false, isCurrent: true, color: '#f59e0b' },
                  { name: 'Sofia Mística', isHost: false, isBot: false, isCurrent: false, color: '#a855f7' },
                  { name: 'Lucas_GS', isHost: false, isBot: false, isCurrent: false, color: '#10b981' },
                  { name: 'Bot Dixit Alpha', isHost: false, isBot: true, isCurrent: false, color: '#0ea5e9' },
                ].map((player, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 shadow-sm ${
                      player.isCurrent
                        ? `${theme.accentBgLight} ${theme.accentBorder}`
                        : `${theme.innerCardBg} border-white/10 hover:${theme.accentBorder}`
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-sm shrink-0 shadow-lg border border-white/10"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`font-cinzel font-bold text-xs block truncate ${player.isCurrent ? theme.accentText : 'text-white'}`}>
                        {player.name}
                      </span>
                      <span className="text-white/40 text-[10px] font-sans uppercase tracking-wider block">
                        {player.isBot ? 'Jogador Bot' : 'Conectado'}
                      </span>
                    </div>

                    {player.isHost && (
                      <div className={`w-6 h-6 flex items-center justify-center rounded-lg border ${theme.accentBgLight} ${theme.accentBorder} ${theme.accentText} shrink-0`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Spectators Box */}
              <div className="pt-2">
                <div className={`border rounded-xl p-3 flex items-center justify-between ${theme.innerCardBg}`}>
                  <span className="text-xs font-cinzel font-bold text-white/70">Espectadores (1)</span>
                  <Button variant="ghost" size="xs">
                    Tornar-se Espectador
                  </Button>
                </div>
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
                    className={`flex-1 rounded-xl px-4 py-3 text-white font-cinzel text-lg italic outline-none ${theme.inputBg}`}
                  />
                  <Button variant="primary" size="md" className="shrink-0">
                    Enviar Pista
                  </Button>
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
                    <Button variant="primary" size="sm" className="w-full">
                      Jogar Esta
                    </Button>
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
                    <Button variant="primary" size="sm" className="w-full">
                      Votar Carta {idx}
                    </Button>
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
                <Button variant="primary" size="sm">
                  Próxima Rodada →
                </Button>
              </div>

              {/* Leaderboard Table */}
              <div className={`border rounded-2xl p-5 space-y-3 ${theme.innerCardBg}`}>
                <h5 className={`text-xs font-cinzel font-bold uppercase tracking-wider ${theme.accentText}`}>
                  Placar Geral da Sala
                </h5>
                <div className="space-y-2">
                  {[
                    { rank: '1º', name: 'Sofia Mística', pts: '18 pts', change: '+3 pts' },
                    { rank: '2º', name: 'Você (Narrador)', pts: '15 pts', change: '+3 pts' },
                    { rank: '3º', name: 'Lucas_GS', pts: '12 pts', change: '+0 pts' },
                  ].map((row, i) => (
                    <div key={i} className={`flex items-center justify-between border border-white/5 rounded-xl px-4 py-3 text-sm font-sans ${theme.innerCardBg}`}>
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
