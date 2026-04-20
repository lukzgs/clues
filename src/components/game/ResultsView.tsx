import { GameState } from '../../types';
import { GameCard } from './GameCard';

interface ResultsViewProps {
  gameState: GameState;
  playerId: string;
  onNextRound: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  gameState,
  playerId,
  onNextRound,
}) => {
  const narrator = gameState.players[gameState.narratorIndex];
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 py-6 md:py-8 animate-fade-in">
      {/* Pista */}
      <div className="text-center">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-sans font-medium">
          A pista era
        </p>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold tracking-wider text-amber-300 italic">
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Cartas com resultados - Layout horizontal em desktop */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 max-w-6xl px-4">
        {gameState.tableCards.map((tableCard) => {
          const owner = gameState.players.find(p => p.id === tableCard.playerId);
          const isNarratorCard = tableCard.playerId === narrator?.id;

          // Conta votos nesta carta
          const votesOnThis = Object.entries(gameState.votes)
            .filter(([_, orderId]) => orderId === tableCard.orderId)
            .map(([voterId]) => gameState.players.find(p => p.id === voterId));

          return (
            <div key={tableCard.orderId} className="flex flex-col items-center gap-3">
              <GameCard
                card={tableCard.card}
                size="md"
                isHighlighted={isNarratorCard}
                highlightColor="#f59e0b"
              />

              {/* Dono da carta */}
              <div
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 shadow-lg ${isNarratorCard ? 'ring-2 ring-amber-400 ring-offset-4 ring-offset-[#050505]' : ''
                  }`}
                style={{
                  backgroundColor: owner?.color,
                  color: 'white'
                }}
              >
                {owner?.name}
                {isNarratorCard && <span className="ml-1">★</span>}
              </div>

              {/* Votos recebidos */}
              <div className="flex gap-1 min-h-[24px]">
                {votesOnThis.map((voter) => voter && (
                  <div
                    key={voter.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: voter.color }}
                    title={`${voter.name} votou aqui`}
                  >
                    ✓
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Placar atualizado */}
      <div className="bg-[#1A1A1A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-white/60 font-cinzel text-sm uppercase tracking-widest mb-4 text-center font-bold">Placar</h3>
        <div className="space-y-2">
          {[...gameState.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : ''
                  }`}
              >
                <span className="text-white/30 w-5 text-sm font-medium font-sans">{index + 1}.</span>
                <div
                  className="w-7 h-7 rounded-full shrink-0 shadow-inner"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 text-white font-medium font-cinzel">
                  {player.name}
                  {player.id === playerId && (
                    <span className="text-white/30 font-sans text-[10px] uppercase tracking-wider ml-2">(você)</span>
                  )}
                </span>
                <span className="text-amber-300 font-bold font-sans text-lg">
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Botão próxima rodada */}
      {isHost ? (
        <button
          onClick={onNextRound}
          className="bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] px-10 md:px-12 py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300"
        >
          Próxima Rodada →
        </button>
      ) : (
        <p className="text-white/40 font-sans text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></span>
          Aguardando host iniciar próxima rodada...
        </p>
      )}
    </div>
  );
};
