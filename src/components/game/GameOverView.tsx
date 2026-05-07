import { GameState } from '../../types';
import { useTranslation } from '../../i18n/index.tsx';

interface GameOverViewProps {
  gameState: GameState;
  playerId: string;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  gameState,
  playerId,
  onRestartGame,
  onLeaveRoom,
}) => {
  const { t } = useTranslation();
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const winner = gameState.players.find(p => p.id === gameState.winner);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 py-8 animate-fade-in">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl text-amber-400 font-display mb-4">
          {t.gameOver.title}
        </h1>
        <p className="text-xl md:text-2xl text-white">
          <span style={{ color: winner?.color }} className="font-bold">
            {winner?.name ?? gameState.winner}
          </span>
          {' '}{t.gameOver.leave === 'Leave' ? 'won!' : 'venceu!'}
        </p>
      </div>

      {/* Placar final */}
      <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-slate-400 text-sm mb-4 text-center uppercase tracking-widest font-medium">
          {t.gameOver.finalScore}
        </h3>
        <div className="space-y-3">
          {[...gameState.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${index === 0 ? 'bg-amber-500/20 border border-amber-500/30' : ''
                  }`}
              >
                <span className={`text-2xl w-8 text-center ${index === 0 ? 'text-amber-400' :
                    index === 1 ? 'text-slate-400' :
                      index === 2 ? 'text-orange-700' : 'text-slate-600'
                  }`}>
                  {`${index + 1}.`}
                </span>
                <div
                  className="w-8 h-8 rounded-full shadow-lg shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 text-white font-medium">
                  {player.name}
                  {player.id === playerId && (
                    <span className="text-slate-500 text-xs ml-1">({t.common.you})</span>
                  )}
                </span>
                <span className="text-amber-400 font-bold font-mono text-xl">
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4">
        {isHost && (
          <button
            onClick={onRestartGame}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold font-display transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            {t.gameOver.playAgain}
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className={`${isHost ? '' : 'flex-1'} bg-slate-800/80 hover:bg-slate-700 px-8 py-4 rounded-xl text-slate-300 hover:text-white transition-all duration-200 border border-slate-700/50`}
        >
          {t.gameOver.leave}
        </button>
      </div>

      {!isHost && (
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></span>
          {t.gameOver.waitingHost}
        </p>
      )}
    </div>
  );
};
