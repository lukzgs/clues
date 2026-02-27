import React, { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-950">
      <div className="w-full max-w-md lg:max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in">

          {/* Room code */}
          <div className="text-center mb-8">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">
              Codigo da Sala
            </p>
            <div className="bg-slate-800/80 rounded-2xl px-6 py-4 inline-block border border-slate-700">
              <span className="text-3xl md:text-4xl font-mono font-bold text-amber-500 tracking-[0.25em] md:tracking-[0.3em]">
                {gameState.roomCode}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-3">
              Compartilhe este codigo com seus amigos
            </p>
          </div>

          {/* Player list */}
          <div className="mb-8">
            <p className="text-slate-400 text-sm mb-4 font-medium">
              Jogadores ({gameState.players.length}/{GAME_CONFIG.MAX_PLAYERS})
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800/70 p-3 md:p-4 rounded-xl transition-colors border border-slate-700/50"
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shrink-0 shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.isBot ? 'B' : player.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block truncate">
                      {player.name}
                    </span>
                    <div className="flex gap-2 mt-0.5">
                      {player.id === currentPlayer?.id && (
                        <span className="text-slate-500 text-xs">(voce)</span>
                      )}
                      {player.isBot && (
                        <span className="text-cyan-400 text-xs">(bot)</span>
                      )}
                    </div>
                  </div>

                  {player.isHost && (
                    <span className="text-amber-500 text-xs font-bold uppercase bg-amber-500/10 px-2 py-1 rounded-lg">
                      Host
                    </span>
                  )}
                  {!player.isConnected && !player.isBot && (
                    <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded-lg">
                      Offline
                    </span>
                  )}

                  {player.isBot && isHost && onRemoveBot && (
                    <button
                      onClick={() => onRemoveBot(player.id)}
                      className="text-red-400 hover:text-red-300 text-sm w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/30 transition-colors"
                      title="Remover bot"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}

              {Array.from({ length: Math.max(0, 3 - gameState.players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 bg-slate-800/20 p-3 md:p-4 rounded-xl border border-dashed border-slate-700/30"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <span className="text-slate-600 text-lg">?</span>
                  </div>
                  <span className="text-slate-600 text-sm">Aguardando jogador...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Victory conditions — host only, fully local */}
          {isHost && (
            <div className="mb-8">
              <p className="text-slate-400 text-sm mb-4 font-medium">
                Condicoes de Vitoria
              </p>

              <div className="space-y-4">
                {/* Score condition */}
                <div className={`rounded-xl border transition-all duration-200 ${
                  vc.scoreEnabled
                    ? 'bg-slate-800/50 border-indigo-500/40'
                    : 'bg-slate-800/20 border-slate-700/30 opacity-60'
                }`}>
                  <div className="flex items-center justify-between p-4 pb-2">
                    <span className={`text-sm font-medium ${vc.scoreEnabled ? 'text-white' : 'text-slate-500'}`}>
                      Por Pontos
                    </span>
                    <button
                      onClick={() => updateVC({ scoreEnabled: !vc.scoreEnabled })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        vc.scoreEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                      aria-label="Ativar condicao por pontos"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        vc.scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {vc.scoreEnabled && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500 text-xs">Primeiro a atingir</span>
                        <div className="flex items-center gap-1">
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
                            className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-amber-400 font-bold text-sm text-center tabular-nums outline-none focus:border-amber-500 transition-colors
                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-500 text-xs">pts</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={Math.max(10, Math.min(100, vc.targetScore))}
                        onChange={(e) => updateVC({ targetScore: Number(e.target.value) })}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30
                          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>10</span>
                        <span>100</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Narrator rounds condition */}
                <div className={`rounded-xl border transition-all duration-200 ${
                  vc.narratorRoundsEnabled
                    ? 'bg-slate-800/50 border-indigo-500/40'
                    : 'bg-slate-800/20 border-slate-700/30 opacity-60'
                }`}>
                  <div className="flex items-center justify-between p-4 pb-2">
                    <span className={`text-sm font-medium ${vc.narratorRoundsEnabled ? 'text-white' : 'text-slate-500'}`}>
                      Por Rodadas
                    </span>
                    <button
                      onClick={() => updateVC({ narratorRoundsEnabled: !vc.narratorRoundsEnabled })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        vc.narratorRoundsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                      aria-label="Ativar condicao por rodadas"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        vc.narratorRoundsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {vc.narratorRoundsEnabled && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500 text-xs">Cada jogador narra</span>
                        <div className="flex items-center gap-1">
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
                            className="w-12 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-amber-400 font-bold text-sm text-center tabular-nums outline-none focus:border-amber-500 transition-colors
                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-500 text-xs">x</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={Math.max(1, Math.min(5, vc.narratorRounds))}
                        onChange={(e) => updateVC({ narratorRounds: Number(e.target.value) })}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30
                          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>1x</span>
                        <span>5x</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info when both enabled */}
                {vc.scoreEnabled && vc.narratorRoundsEnabled && (
                  <p className="text-slate-500 text-xs text-center px-2">
                    A primeira condicao alcancada encerra o jogo
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isHost ? (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed py-4 rounded-xl font-bold font-display text-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {canStart ? 'Iniciar Jogo' : `Minimo ${GAME_CONFIG.MIN_PLAYERS} jogadores`}
                </button>

                {canAddBot && (
                  <button
                    onClick={onAddBot}
                    className="w-full bg-cyan-600/80 hover:bg-cyan-500 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Adicionar Bot
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 bg-slate-800/30 rounded-xl">
                <span className="w-2 h-2 bg-slate-400 rounded-full inline-block animate-pulse mr-2"></span>
                Aguardando o host iniciar o jogo...
              </div>
            )}

            <button
              onClick={onLeaveRoom}
              className="w-full bg-slate-800/50 hover:bg-slate-700 py-3 rounded-xl text-slate-400 hover:text-white border border-slate-700/50 transition-all duration-200"
            >
              Sair da Sala
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
