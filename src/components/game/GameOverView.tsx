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
      <div className="text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-cinzel font-bold text-amber-300 tracking-[0.15em] drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-4">
          {t.gameOver.title}
        </h1>
        <p className="text-xl md:text-2xl text-white/80 font-cinzel tracking-wide font-light">
          {t.gameOver.winner(winner?.name ?? '')}
        </p>
      </div>

      {/* Placar final */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 w-full max-w-md z-10">
        <h3 className="text-white/40 text-[11px] md:text-xs uppercase tracking-[0.25em] mb-6 text-center font-sans font-semibold">
          {t.gameOver.finalScore}
        </h3>
        <div className="space-y-3 md:space-y-4">
          {[...gameState.players]
            .filter(p => !p.isSpectator)
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-3 md:p-4 rounded-xl transition-all duration-300 border ${
                  index === 0 
                    ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] scale-105' 
                    : 'border-white/10 bg-[#1A1A1A]/60'
                }`}
              >
                <span className={`text-2xl w-8 text-center font-cinzel font-bold ${
                  index === 0 ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                  index === 1 ? 'text-slate-300' :
                  index === 2 ? 'text-orange-400/80' : 'text-white/40'
                }`}>
                  {`${index + 1}.`}
                </span>
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full shadow-lg shrink-0 border border-white/20"
                  style={{ backgroundColor: player.color, boxShadow: `0 0 10px ${player.color}60` }}
                />
                <span className="flex-1 text-white/90 font-cinzel tracking-wide">
                  {player.name}
                  {player.id === playerId && (
                    <span className="text-white/40 text-[10px] ml-2 tracking-widest uppercase">({t.common.you})</span>
                  )}
                </span>
                <span className="text-amber-300 font-cinzel font-bold text-lg md:text-xl tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4 z-10">
        {isHost && (
          <button
            onClick={onRestartGame}
            className="flex-1 bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.35)] font-cinzel font-bold uppercase tracking-[0.2em] py-3.5 md:py-4 rounded-xl transition-all duration-300"
          >
            {t.gameOver.playAgain}
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className={`${isHost ? 'flex-1 sm:flex-none sm:w-32' : 'flex-1'} bg-transparent border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 hover:border-white/20 py-3.5 md:py-4 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] transition-all duration-200`}
        >
          {t.gameOver.leave}
        </button>
      </div>

      {!isHost && (
        <p className="text-white/40 font-cinzel font-bold uppercase tracking-widest text-xs md:text-sm flex items-center gap-3 mt-2 z-10">
          <span className="w-1.5 h-1.5 bg-amber-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
          {t.gameOver.waitingHost}
        </p>
      )}
    </div>
  );
};
