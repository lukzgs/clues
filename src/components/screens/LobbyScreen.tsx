import { useState } from 'react';
import { GameState, Player, VictoryCondition, DeckOption } from '../../types';
import { GAME_CONFIG } from '../../constants';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: (victoryCondition: VictoryCondition, deckOption: DeckOption) => void;
  onLeaveRoom: () => void;
  onAddBot?: () => void;
  onRemoveBot?: (botId: string) => void;
  onKickPlayer?: (targetId: string) => void;
  onToggleSpectator?: (targetId: string) => void;
  onRequestPlay?: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  gameState,
  currentPlayer,
  onStartGame,
  onLeaveRoom,
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  onToggleSpectator,
  onRequestPlay,
}) => {
  const activePlayers = gameState.players.filter(p => !p.isSpectator);
  const spectators = gameState.players.filter(p => p.isSpectator);
  const isHost = currentPlayer?.isHost ?? false;
  const canAddBot = GAME_CONFIG.ENABLE_BOTS && gameState.players.length < GAME_CONFIG.MAX_CONNECTIONS && onAddBot;

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Victory condition is fully local — only sent to server on START_GAME
  const [vc, setVC] = useState<VictoryCondition>({
    scoreEnabled: true,
    targetScore: GAME_CONFIG.WINNING_SCORE,
    narratorRoundsEnabled: false,
    narratorRounds: GAME_CONFIG.DEFAULT_NARRATOR_ROUNDS,
  });

  const updateVC = (patch: Partial<VictoryCondition>) => {
    setVC(prev => {
      const next = { ...prev, ...patch };
      // At least one condition must stay enabled
      if (!next.scoreEnabled && !next.narratorRoundsEnabled) return prev;
      return next;
    });
  };

  const [deckOption, setDeckOption] = useState<DeckOption>('mixed');

  const maxPlayersForDeck = deckOption === 'mixed' ? GAME_CONFIG.MAX_PLAYERS_MIXED : GAME_CONFIG.MAX_PLAYERS;
  const canStart = activePlayers.length >= GAME_CONFIG.MIN_PLAYERS;

  const handleStartGame = () => {
    onStartGame(vc, deckOption);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-3 md:p-4">
      {/* Ambient Lighting — same as JoinScreen */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
      />
      <div
        className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]"
      />

      <div className="w-full max-w-[1250px] z-10 my-6 md:my-0">
        <div
          className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 flex flex-col"
          style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            
            {/* Left Panel: Game Options */}
            <div className="flex flex-col h-full bg-[#1A1A1A]/30 border border-white/10 rounded-3xl p-6 md:p-8" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-5 font-sans font-bold">
                OPÇÕES DO JOGO
              </p>

              <div className="space-y-4 flex-1">
                {/* Score condition */}
                <div className={`rounded-2xl border transition-all duration-300 ${
                  vc.scoreEnabled
                    ? 'bg-[#1A1A1A]/50 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                    : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
                }`}>
                  <div className="flex items-center justify-between p-4 pb-3">
                    <span className={`text-sm md:text-lg font-cinzel font-bold tracking-wider ${vc.scoreEnabled ? 'text-white' : 'text-white/30'}`}>
                      POR PONTUAÇÃO
                    </span>
                    {isHost ? (
                      <button
                        onClick={() => updateVC({ scoreEnabled: !vc.scoreEnabled })}
                        className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors duration-300 ${
                          vc.scoreEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10'
                        }`}
                        aria-label="Toggle score condition"
                      >
                        <span className={`absolute top-0.5 left-0.5 md:top-1 md:left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          vc.scoreEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    ) : (
                      <span className="text-white/30 text-[10px] md:text-xs font-sans font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg">{vc.scoreEnabled ? 'ON' : 'OFF'}</span>
                    )}
                  </div>

                  {vc.scoreEnabled && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-bold">PRIMEIRO A CHEGAR</span>
                        <div className="flex items-center gap-2">
                          {isHost ? (
                            <input
                              type="number"
                              min={10}
                              max={100}
                              step={5}
                              value={vc.targetScore}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (!isNaN(v)) updateVC({ targetScore: v });
                              }}
                              onBlur={() => updateVC({ targetScore: Math.max(10, Math.min(100, vc.targetScore)) })}
                              className="w-16 md:w-20 bg-[#1A1A1A]/80 border border-white/20 rounded-xl px-2 py-1.5 text-amber-300 font-cinzel font-bold text-lg md:text-xl text-center tabular-nums outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="bg-[#1A1A1A]/80 border border-white/10 rounded-xl px-4 py-2 text-amber-300/90 font-cinzel font-bold text-lg md:text-xl tabular-nums">{vc.targetScore}</span>
                          )}
                          <span className="text-white/30 text-[10px] tracking-widest font-sans font-bold uppercase">PONTOS</span>
                        </div>
                      </div>
                      {isHost && (
                        <>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={Math.max(10, Math.min(100, vc.targetScore))}
                            onChange={(e) => updateVC({ targetScore: Number(e.target.value) })}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40
                              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                          />
                          <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                            <span>10</span>
                            <span>100</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Narrator rounds condition */}
                <div className={`rounded-2xl border transition-all duration-300 ${
                  vc.narratorRoundsEnabled
                    ? 'bg-[#1A1A1A]/50 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                    : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
                }`}>
                  <div className="flex items-center justify-between p-4 pb-3">
                    <span className={`text-sm md:text-lg font-cinzel font-bold tracking-wider ${vc.narratorRoundsEnabled ? 'text-white' : 'text-white/30'}`}>
                      POR RODADAS
                    </span>
                    {isHost ? (
                      <button
                        onClick={() => updateVC({ narratorRoundsEnabled: !vc.narratorRoundsEnabled })}
                        className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors duration-300 ${
                          vc.narratorRoundsEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10'
                        }`}
                        aria-label="Toggle rounds condition"
                      >
                        <span className={`absolute top-0.5 left-0.5 md:top-1 md:left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          vc.narratorRoundsEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    ) : (
                      <span className="text-white/30 text-[10px] md:text-xs font-sans font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg">{vc.narratorRoundsEnabled ? 'ON' : 'OFF'}</span>
                    )}
                  </div>

                  {vc.narratorRoundsEnabled && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-bold">CADA JOGADOR NARRA</span>
                        <div className="flex items-center gap-2">
                          {isHost ? (
                            <input
                              type="number"
                              min={1}
                              max={5}
                              step={1}
                              value={vc.narratorRounds}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (!isNaN(v)) updateVC({ narratorRounds: v });
                              }}
                              onBlur={() => updateVC({ narratorRounds: Math.max(1, Math.min(5, vc.narratorRounds)) })}
                              className="w-16 md:w-20 bg-[#1A1A1A]/80 border border-white/20 rounded-xl px-2 py-1.5 text-amber-300 font-cinzel font-bold text-lg md:text-xl text-center tabular-nums outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="bg-[#1A1A1A]/80 border border-white/10 rounded-xl px-4 py-2 text-amber-300/90 font-cinzel font-bold text-lg md:text-xl tabular-nums">{vc.narratorRounds}</span>
                          )}
                          <span className="text-white/30 text-[10px] tracking-widest font-sans font-bold uppercase">VEZES</span>
                        </div>
                      </div>
                      {isHost && (
                        <>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={Math.max(1, Math.min(5, vc.narratorRounds))}
                            onChange={(e) => updateVC({ narratorRounds: Number(e.target.value) })}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40
                              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                          />
                          <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                            <span>1x</span>
                            <span>5x</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Info when both enabled */}
                {vc.scoreEnabled && vc.narratorRoundsEnabled && (
                  <p className="text-white/30 text-[11px] md:text-xs text-center px-4 font-sans mt-3 tracking-wide">
                    A primeira condição atingida encerra o jogo
                  </p>
                )}
              </div>

              {/* Deck Selection */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-bold">
                  PISCINA DE CARTAS
                </p>
                <div className="flex bg-[#1A1A1A]/50 border border-white/10 rounded-[1.25rem] p-1.5 relative z-0">
                  <div
                    className="absolute inset-y-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all duration-300 z-[-1] shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                    style={{
                      width: 'calc(33.333% - 4px)',
                      left: deckOption === 'original' ? '4px' : deckOption === 'new' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                    }}
                  />
                  {(['original', 'new', 'mixed'] as DeckOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => isHost && setDeckOption(option)}
                      disabled={!isHost}
                      className={`flex-1 py-3 md:py-3.5 text-[11px] md:text-base font-cinzel font-bold tracking-widest transition-colors duration-200 uppercase rounded-xl
                        ${deckOption === option ? 'text-amber-300' : 'text-white/40 hover:text-white/80'}
                        ${!isHost && 'cursor-default'}
                      `}
                    >
                      {option === 'original' ? 'Original' : option === 'new' ? 'Novo' : 'Misturado'}
                    </button>
                  ))}
                </div>
                {!isHost && (
                  <p className="text-center mt-3 text-[11px] md:text-xs font-sans tracking-wide text-white/30">
                    O anfitrião está escolhendo o baralho...
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-8 space-y-3.5 pt-6 border-t border-white/10">
                {isHost ? (
                  <>
                    <button
                      onClick={handleStartGame}
                      disabled={!canStart}
                      className={`w-full py-3.5 md:py-4 rounded-xl font-cinzel font-bold uppercase tracking-widest text-base md:text-lg transition-all duration-300 ${
                        canStart
                          ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                          : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {canStart ? 'INICIAR JOGO' : `Mínimo ${GAME_CONFIG.MIN_PLAYERS} jogadores`}
                    </button>

                    {canAddBot && (
                      <button
                        onClick={onAddBot}
                        className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 py-3 md:py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01]"
                      >
                        <span className="text-xl leading-none mr-1 font-sans font-light">+</span>
                        ADD BOT
                      </button>
                    )}
                  </>
                ) : currentPlayer?.isSpectator ? (
                  <div className="space-y-3">
                    {onRequestPlay && (
                      <button
                        onClick={onRequestPlay}
                        disabled={activePlayers.length >= maxPlayersForDeck}
                        className={`w-full py-3.5 md:py-4 rounded-xl font-cinzel font-bold uppercase tracking-[0.2em] text-base md:text-lg transition-all duration-300 ${
                          activePlayers.length < maxPlayersForDeck
                            ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {activePlayers.length < maxPlayersForDeck ? 'ENTRAR COMO JOGADOR' : 'Lobby Lotado'}
                      </button>
                    )}
                    <div className="text-center py-3 text-white/40 bg-[#1A1A1A]/40 rounded-xl border border-white/10 font-sans text-sm tracking-wide flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400/60"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Você é um espectador
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 text-white/40 bg-[#1A1A1A]/40 rounded-xl border border-white/10 font-sans text-base tracking-wide">
                    <span className="w-2 h-2 bg-amber-400/80 rounded-full inline-block animate-pulse mr-3 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    Aguardando o host iniciar...
                  </div>
                )}
                <button
                  onClick={onLeaveRoom}
                  className="w-full bg-transparent border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 hover:border-white/20 py-3 md:py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-sm md:text-base transition-all duration-200"
                >
                  SAIA DA SALA
                </button>
              </div>
            </div>

            {/* Right Panel: Room Code & Players */}
            <div className="flex flex-col h-full bg-[#1A1A1A]/30 border border-white/10 rounded-3xl p-6 md:p-8" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
              {/* Room code */}
              <div className="text-center mb-10 w-full">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-bold">
                  CÓDIGO DA SALA
                </p>
                <div className="bg-[#1A1A1A]/60 rounded-2xl px-6 md:px-8 py-4 md:py-5 inline-flex items-center gap-4 border border-white/10 shadow-inner">
                  <span className="text-3xl md:text-4xl font-cinzel font-bold text-amber-300 tracking-[0.15em]">
                    {gameState.roomCode}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${
                      copied
                        ? 'text-green-400 bg-green-500/10 scale-110'
                        : 'text-white/40 hover:text-amber-300 hover:bg-white/5'
                    }`}
                    title="Copy room link"
                    aria-label="Copy room link"
                  >
                    {copied ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-white/30 text-[11px] md:text-xs mt-3 font-sans tracking-widest uppercase">
                  {copied ? 'Link copiado!' : 'Toque para copiar o link'}
                </p>
              </div>

              {/* Player list */}
              <div className="w-full flex-1">
                <p className="text-white/40 text-[11px] md:text-xs uppercase tracking-[0.25em] mb-4 pl-2 font-sans font-semibold">
                  JOGADORES ({activePlayers.length}/{maxPlayersForDeck}){spectators.length > 0 && <span className="text-white/25"> · {spectators.length} {spectators.length !== 1 ? 'espectadores' : 'espectador'}</span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 bg-[#1A1A1A]/60 p-3 rounded-2xl border transition-all duration-300 h-[72px] md:h-[76px] shadow-sm ${
                        player.isSpectator
                          ? 'border-white/5 opacity-60'
                          : 'border-white/10 hover:border-white/30 hover:bg-[#1A1A1A]/80'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-lg md:text-xl shrink-0 shadow-lg border border-white/10 ${player.isSpectator ? 'grayscale-[50%]' : ''}`}
                        style={{ backgroundColor: player.color }}
                      >
                        {player.isSpectator ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : player.isBot ? 'B' : player.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-white font-cinzel font-bold text-sm md:text-base block truncate tracking-wide">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                          {player.id === currentPlayer?.id && (
                            <span className="text-white/40 text-[10px] uppercase tracking-widest font-sans font-medium shrink-0">(you)</span>
                          )}
                          {player.isHost && (
                            <span className="text-amber-400 text-[10px] font-cinzel font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] shrink-0">
                              ANFITRIÃO
                            </span>
                          )}
                          {player.isSpectator && (
                            <span className="text-blue-400/70 text-[10px] font-sans font-bold uppercase tracking-widest shrink-0">
                              ESPECTADOR
                            </span>
                          )}
                          {!player.isConnected && !player.isBot && (
                            <span className="text-red-400 text-[10px] font-sans uppercase tracking-widest shrink-0">
                              DESCONECTADO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Host actions: toggle spectator + kick (not on self) */}
                      {isHost && player.id !== currentPlayer?.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle spectator */}
                          {onToggleSpectator && (
                            <button
                              onClick={() => onToggleSpectator(player.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 ${
                                player.isSpectator
                                  ? 'text-blue-400/60 hover:text-blue-300 hover:bg-blue-500/10'
                                  : 'text-white/20 hover:text-blue-400 hover:bg-blue-500/10'
                              }`}
                              title={player.isSpectator ? 'Make player' : 'Make spectator'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          )}
                          {/* Kick */}
                          {onKickPlayer && (
                            <button
                              onClick={() => onKickPlayer(player.id)}
                              className="text-white/20 hover:text-red-400 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-all duration-300"
                              title="Remove player"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Bot remove (legacy) */}
                      {GAME_CONFIG.ENABLE_BOTS && player.isBot && isHost && onRemoveBot && !onKickPlayer && (
                        <button
                          onClick={() => onRemoveBot(player.id)}
                          className="text-white/20 hover:text-red-400 text-lg w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-all duration-300 mr-1"
                          title="Remove bot"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, maxPlayersForDeck - activePlayers.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex items-center gap-3 bg-[#1A1A1A]/20 p-3 rounded-2xl border border-dashed border-white/10 h-[72px] md:h-[76px] opacity-70"
                    >
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                        <span className="text-white/20 text-xl font-light">?</span>
                      </div>
                      <span className="text-white/20 text-[10px] font-cinzel font-bold uppercase tracking-[0.2em]">AGUARDANDO...</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 md:bottom-6 w-full text-center z-0 pointer-events-none" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
        <p className="text-white/20 text-[10px] font-sans tracking-wide">
          &copy; 2026 Story Weaver. Crafted for imagination.
        </p>
      </div>
    </div>
  );
};
