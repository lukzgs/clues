import React from 'react';
import { GameState, Player } from '../../types';
import { GAME_CONFIG } from '../../constants';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: () => void;
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-950">
      {/* Container responsivo - mais largo em desktop */}
      <div className="w-full max-w-md lg:max-w-2xl">
        {/* Card principal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in">

          {/* Código da sala */}
          <div className="text-center mb-8">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">
              Código da Sala
            </p>
            <div className="bg-slate-800/80 rounded-2xl px-6 py-4 inline-block border border-slate-700">
              <span className="text-3xl md:text-4xl font-mono font-bold text-amber-500 tracking-[0.25em] md:tracking-[0.3em]">
                {gameState.roomCode}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-3">
              Compartilhe este código com seus amigos
            </p>
          </div>

          {/* Lista de jogadores - grid em desktop */}
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
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shrink-0 shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.isBot ? '🤖' : player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Nome e tags */}
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block truncate">
                      {player.name}
                    </span>
                    <div className="flex gap-2 mt-0.5">
                      {player.id === currentPlayer?.id && (
                        <span className="text-slate-500 text-xs">(você)</span>
                      )}
                      {player.isBot && (
                        <span className="text-cyan-400 text-xs">(bot)</span>
                      )}
                    </div>
                  </div>

                  {/* Status badges */}
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

                  {/* Remover bot */}
                  {player.isBot && isHost && onRemoveBot && (
                    <button
                      onClick={() => onRemoveBot(player.id)}
                      className="text-red-400 hover:text-red-300 text-sm w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/30 transition-colors"
                      title="Remover bot"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Slots vazios (apenas visual) */}
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

          {/* Ações */}
          <div className="space-y-3">
            {isHost ? (
              <>
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed py-4 rounded-xl font-bold font-display text-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {canStart ? '▶ Iniciar Jogo' : `Mínimo ${GAME_CONFIG.MIN_PLAYERS} jogadores`}
                </button>

                {canAddBot && (
                  <button
                    onClick={onAddBot}
                    className="w-full bg-cyan-600/80 hover:bg-cyan-500 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>🤖</span> Adicionar Bot
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 bg-slate-800/30 rounded-xl">
                <span className="animate-pulse">●</span> Aguardando o host iniciar o jogo...
              </div>
            )}

            <button
              onClick={onLeaveRoom}
              className="w-full bg-slate-800/50 hover:bg-slate-700 py-3 rounded-xl text-slate-400 hover:text-white border border-slate-700/50 transition-all duration-200"
            >
              ← Sair da Sala
            </button>
          </div>
        </div>

        {/* Rodapé com info */}
        <p className="text-center text-slate-600 text-xs mt-4">
          Jogo inspirado em Dixit • {GAME_CONFIG.MIN_PLAYERS}-{GAME_CONFIG.MAX_PLAYERS} jogadores
        </p>
      </div>
    </div>
  );
};
