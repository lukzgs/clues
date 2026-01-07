import React from 'react';
import { GameState, Player } from '../../types';
import { GAME_CONFIG } from '../../constants';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  // [BOT] Props opcionais para bots
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
  const hasBots = gameState.players.some(p => p.isBot);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        {/* Código da sala */}
        <div className="text-center mb-8">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
            Código da Sala
          </p>
          <div className="bg-slate-800 rounded-2xl p-4 inline-block">
            <span className="text-4xl font-mono font-bold text-amber-400 tracking-[0.3em]">
              {gameState.roomCode}
            </span>
          </div>
          <p className="text-slate-600 text-xs mt-2">
            Compartilhe este código com seus amigos
          </p>
        </div>

        {/* Lista de jogadores */}
        <div className="mb-8">
          <p className="text-slate-400 text-sm mb-3">
            Jogadores ({gameState.players.length}/{GAME_CONFIG.MAX_PLAYERS})
          </p>
          <div className="space-y-2">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {player.isBot ? '🤖' : player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium flex-1">
                  {player.name}
                  {player.id === currentPlayer?.id && (
                    <span className="text-slate-500 text-xs ml-2">(você)</span>
                  )}
                  {player.isBot && (
                    <span className="text-cyan-500 text-xs ml-2">(bot)</span>
                  )}
                </span>
                {player.isHost && (
                  <span className="text-amber-500 text-xs font-bold uppercase">
                    Host
                  </span>
                )}
                {!player.isConnected && !player.isBot && (
                  <span className="text-red-500 text-xs">
                    Desconectado
                  </span>
                )}
                {/* [BOT] Botão remover bot */}
                {player.isBot && isHost && onRemoveBot && (
                  <button
                    onClick={() => onRemoveBot(player.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
                  >
                    ✕
                  </button>
                )}
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed py-4 rounded-xl font-bold cinzel text-lg transition-colors"
              >
                {canStart ? 'Iniciar Jogo' : `Mínimo ${GAME_CONFIG.MIN_PLAYERS} jogadores`}
              </button>

              {/* [BOT] Botão adicionar bot */}
              {canAddBot && (
                <button
                  onClick={onAddBot}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>🤖</span> Adicionar Bot
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-slate-400">
              Aguardando o host iniciar o jogo...
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Sair da Sala
          </button>
        </div>
      </div>
    </div>
  );
};
