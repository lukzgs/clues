import React, { useState, useCallback } from 'react';
import { GamePhase } from './types';
import { useGameRoom } from './hooks';
import { JoinScreen, LobbyScreen, GameScreen } from './components/screens';

// Gera código de sala aleatório
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

type AppState =
  | { screen: 'join' }
  | { screen: 'connecting'; roomCode: string; playerName: string }
  | { screen: 'game'; roomCode: string; playerName: string };

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ screen: 'join' });

  // Hook do jogo - só conecta quando temos roomCode e playerName
  const {
    gameState,
    playerId,
    isConnected,
    error,
    startGame,
    submitClue,
    playCard,
    vote,
    nextRound,
    restartGame,
    leaveRoom,
    addBot,
    removeBot,
  } = useGameRoom({
    roomCode: appState.screen !== 'join' ? appState.roomCode : '',
    playerName: appState.screen !== 'join' ? appState.playerName : '',
  });

  // Handlers
  const handleCreateRoom = useCallback((playerName: string) => {
    const roomCode = generateRoomCode();
    setAppState({ screen: 'connecting', roomCode, playerName });
  }, []);

  const handleJoinRoom = useCallback((roomCode: string, playerName: string) => {
    setAppState({ screen: 'connecting', roomCode, playerName });
  }, []);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    setAppState({ screen: 'join' });
  }, [leaveRoom]);

  // Transição de connecting para game quando conectado
  React.useEffect(() => {
    if (appState.screen === 'connecting' && isConnected && gameState) {
      setAppState(prev =>
        prev.screen === 'connecting'
          ? { screen: 'game', roomCode: prev.roomCode, playerName: prev.playerName }
          : prev
      );
    }
  }, [appState.screen, isConnected, gameState]);

  // Tela de join
  if (appState.screen === 'join') {
    return (
      <JoinScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  // Tela de conexão
  if (appState.screen === 'connecting' || !gameState || !playerId) {
    const roomCode = appState.screen === 'connecting' ? appState.roomCode :
      appState.screen === 'game' ? appState.roomCode : '';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            Conectando à sala {roomCode}...
          </p>
          {error && (
            <div className="mt-4">
              <p className="text-red-400 mb-2">{error}</p>
              <button
                onClick={() => setAppState({ screen: 'join' })}
                className="text-slate-500 hover:text-white"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de lobby
  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <LobbyScreen
        gameState={gameState}
        currentPlayer={gameState.players.find(p => p.id === playerId)}
        onStartGame={startGame}
        onLeaveRoom={handleLeaveRoom}
        onAddBot={addBot}
        onRemoveBot={removeBot}
      />
    );
  }

  // Tela de jogo
  return (
    <GameScreen
      gameState={gameState}
      playerId={playerId}
      onSubmitClue={submitClue}
      onPlayCard={playCard}
      onVote={vote}
      onNextRound={nextRound}
      onRestartGame={restartGame}
      onLeaveRoom={handleLeaveRoom}
    />
  );
};

export default App;
