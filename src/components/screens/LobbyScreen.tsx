import { useState } from 'react';
import { GameState, Player, VictoryCondition } from '../../types';
import { GAME_CONFIG } from '../../constants';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: (victoryCondition: VictoryCondition) => void;
  onLeaveRoom: () => void;
  onAddBot?: () => void;
  onRemoveBot?: (botId: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  gameState,
  currentPlayer,
  onStartGame,
  onLeaveRoom,
  onAddBot,
  onRemoveBot,
}) => {
  const canStart = gameState.players.length >= GAME_CONFIG.MIN_PLAYERS;
  const isHost = currentPlayer?.isHost ?? false;
  const canAddBot = gameState.players.length < GAME_CONFIG.MAX_PLAYERS && onAddBot;

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

  const handleStartGame = () => {
    onStartGame(vc);
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

      <div className="w-full max-w-[900px] z-10 my-6 md:my-0">
        <div
          className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-4 md:p-8 flex flex-col"
          style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Left Panel: Game Options */}
            <div className="flex flex-col h-full bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-5 md:p-6" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-medium">
                Game Options
              </p>

              <div className="space-y-3 flex-1">
                {/* Score condition */}
                <div className={`rounded-xl border transition-all duration-300 ${
                  vc.scoreEnabled
                    ? 'bg-[#1A1A1A]/50 border-amber-500/20'
                    : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
                }`}>
                  <div className="flex items-center justify-between p-3 pb-2">
                    <span className={`text-sm font-cinzel ${vc.scoreEnabled ? 'text-white' : 'text-white/30'}`}>
                      By Score
                    </span>
                    {isHost ? (
                      <button
                        onClick={() => updateVC({ scoreEnabled: !vc.scoreEnabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                          vc.scoreEnabled ? 'bg-amber-500/80' : 'bg-white/10'
                        }`}
                        aria-label="Toggle score condition"
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          vc.scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    ) : (
                      <span className="text-white/30 text-[10px] font-sans font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{vc.scoreEnabled ? 'ON' : 'OFF'}</span>
                    )}
                  </div>

                  {vc.scoreEnabled && (
                    <div className="px-3 pb-3 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/30 text-[10px] font-sans">First to reach</span>
                        <div className="flex items-center gap-1">
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
                              className="w-14 bg-[#1A1A1A]/80 border border-white/10 rounded-lg px-2 py-1 text-amber-300 font-cinzel font-bold text-sm text-center tabular-nums outline-none focus:border-amber-500/50 transition-colors
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="bg-[#1A1A1A]/80 border border-white/5 rounded-lg px-2 py-1 text-amber-300/80 font-cinzel font-bold text-sm tabular-nums">{vc.targetScore}</span>
                          )}
                          <span className="text-white/30 text-[10px] font-sans">pts</span>
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
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30
                              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                          />
                          <div className="flex justify-between text-[9px] text-white/15 mt-1 font-sans">
                            <span>10</span>
                            <span>100</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Narrator rounds condition */}
                <div className={`rounded-xl border transition-all duration-300 ${
                  vc.narratorRoundsEnabled
                    ? 'bg-[#1A1A1A]/50 border-amber-500/20'
                    : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
                }`}>
                  <div className="flex items-center justify-between p-3 pb-2">
                    <span className={`text-sm font-cinzel ${vc.narratorRoundsEnabled ? 'text-white' : 'text-white/30'}`}>
                      By Rounds
                    </span>
                    {isHost ? (
                      <button
                        onClick={() => updateVC({ narratorRoundsEnabled: !vc.narratorRoundsEnabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                          vc.narratorRoundsEnabled ? 'bg-amber-500/80' : 'bg-white/10'
                        }`}
                        aria-label="Toggle rounds condition"
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          vc.narratorRoundsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    ) : (
                      <span className="text-white/30 text-[10px] font-sans font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{vc.narratorRoundsEnabled ? 'ON' : 'OFF'}</span>
                    )}
                  </div>

                  {vc.narratorRoundsEnabled && (
                    <div className="px-3 pb-3 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/30 text-[10px] font-sans">Each player narrates</span>
                        <div className="flex items-center gap-1">
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
                              className="w-12 bg-[#1A1A1A]/80 border border-white/10 rounded-lg px-2 py-1 text-amber-300 font-cinzel font-bold text-sm text-center tabular-nums outline-none focus:border-amber-500/50 transition-colors
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="bg-[#1A1A1A]/80 border border-white/5 rounded-lg px-2 py-1 text-amber-300/80 font-cinzel font-bold text-sm tabular-nums">{vc.narratorRounds}</span>
                          )}
                          <span className="text-white/30 text-[10px] font-sans">x</span>
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
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30
                              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                          />
                          <div className="flex justify-between text-[9px] text-white/15 mt-1 font-sans">
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
                  <p className="text-white/20 text-[10px] text-center px-2 font-sans mt-2">
                    First condition reached ends the game
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2.5 md:space-y-3 pt-5 border-t border-white/5">
                {isHost ? (
                  <>
                    <button
                      onClick={handleStartGame}
                      disabled={!canStart}
                      className={`w-full py-3 md:py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300 ${
                        canStart
                          ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                          : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {canStart ? 'Start Game' : `Min ${GAME_CONFIG.MIN_PLAYERS} players`}
                    </button>

                    {canAddBot && (
                      <button
                        onClick={onAddBot}
                        className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 py-2.5 md:py-3 rounded-xl font-cinzel font-bold uppercase tracking-widest text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        ADD BOT
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-white/30 bg-[#1A1A1A]/30 rounded-xl border border-white/5 font-sans text-sm">
                    <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full inline-block animate-pulse mr-2" />
                    Waiting for host to start...
                  </div>
                )}
                <button
                  onClick={onLeaveRoom}
                  className="w-full bg-white/5 border border-white/10 text-white/30 hover:text-white/60 py-2.5 md:py-3 rounded-xl font-cinzel font-bold uppercase tracking-widest text-xs md:text-sm transition-all duration-200"
                >
                  LEAVE ROOM
                </button>
              </div>
            </div>

            {/* Right Panel: Room Code & Players */}
            <div className="flex flex-col h-full bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-5 md:p-6" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
              {/* Room code */}
              <div className="text-center mb-6 w-full">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 md:mb-3 font-sans font-medium">
                  Room Code
                </p>
                <div className="bg-[#1A1A1A]/50 rounded-xl px-5 py-3 inline-flex items-center gap-3 border border-white/10">
                  <span className="text-2xl font-cinzel font-bold text-amber-300 tracking-wider">
                    {gameState.roomCode}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      copied
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    }`}
                    title="Copy room link"
                    aria-label="Copy room link"
                  >
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-white/20 text-[10px] mt-2 font-sans tracking-wide">
                  {copied ? 'Link copied!' : 'Tap to copy invite link'}
                </p>
              </div>

              {/* Player list */}
              <div className="w-full flex-1">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 pl-1 font-sans font-medium">
                  Players ({gameState.players.length}/{GAME_CONFIG.MAX_PLAYERS})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2.5 bg-[#1A1A1A]/50 p-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 h-[64px]"
                    >
                      <div
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-sm shrink-0 shadow-lg"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.isBot ? 'B' : player.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-white font-cinzel text-sm block truncate">
                          {player.name}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {player.id === currentPlayer?.id && (
                            <span className="text-white/30 text-[9px] uppercase tracking-wider font-sans">(you)</span>
                          )}
                          {player.isBot && (
                            <span className="text-amber-400/60 text-[9px] uppercase tracking-wider font-sans">(bot)</span>
                          )}
                          {player.isHost && (
                            <span className="text-amber-300 text-[9px] font-cinzel font-bold uppercase tracking-wider">
                              Host
                            </span>
                          )}
                          {!player.isConnected && !player.isBot && (
                            <span className="text-red-400 text-[9px] font-sans">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {player.isBot && isHost && onRemoveBot && (
                        <button
                          onClick={() => onRemoveBot(player.id)}
                          className="text-white/30 hover:text-red-400 text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-all duration-200"
                          title="Remove bot"
                          aria-label={`Remove bot ${player.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, GAME_CONFIG.MAX_PLAYERS - gameState.players.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex items-center gap-2.5 bg-[#1A1A1A]/20 p-2.5 rounded-xl border border-dashed border-white/5 h-[64px]"
                    >
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-white/15 text-lg">?</span>
                      </div>
                      <span className="text-white/15 text-[10px] md:text-[11px] font-cinzel font-bold uppercase tracking-widest">Waiting...</span>
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
          &copy; 2026 Clues. Crafted for imagination.
        </p>
      </div>
    </div>
  );
};
