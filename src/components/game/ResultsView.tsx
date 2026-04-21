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
    <div className="flex flex-col items-center gap-10 md:gap-12 py-6 md:py-8 animate-fade-in w-full max-w-6xl mx-auto">
      {/* Pista */}
      <div className="text-center bg-black/40 backdrop-blur-2xl border border-amber-500/30 ring-1 ring-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.1)] px-10 py-6 rounded-2xl md:rounded-full max-w-xl">
        <p className="text-amber-200/50 text-[10px] uppercase tracking-[0.25em] mb-2 font-sans font-bold">
          A pista era
        </p>
        <h2 className="text-2xl md:text-4xl font-cinzel font-bold tracking-wider text-amber-300">
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Cartas com resultados */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 px-4 w-full">
        {gameState.tableCards.map((tableCard) => {
          const owner = gameState.players.find(p => p.id === tableCard.playerId);
          const isNarratorCard = tableCard.playerId === narrator?.id;

          // Conta votos nesta carta
          const votesOnThis = Object.entries(gameState.votes)
            .filter(([_, orderId]) => orderId === tableCard.orderId)
            .map(([voterId]) => gameState.players.find(p => p.id === voterId));

          return (
            <div key={tableCard.orderId} className="flex flex-col items-center gap-4">
              <GameCard
                card={tableCard.card}
                size="lg"
                isHighlighted={isNarratorCard}
                highlightColor={isNarratorCard ? '#f59e0b' : 'transparent'}
                className={isNarratorCard ? "shadow-[0_0_25px_rgba(245,158,11,0.4)]" : "opacity-80"}
              />

              {/* Dono da carta */}
              <div
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold flex items-center gap-2 shadow-xl ${
                  isNarratorCard 
                    ? 'ring-2 ring-amber-400 bg-amber-500/20 text-amber-300 border border-amber-400/50' 
                    : 'bg-[#1A1A1A]/80 text-white/70 border border-white/10'
                }`}
              >
                {/* Indicador de cor do jogador (bolinha) */}
                <div 
                  className="w-3 h-3 rounded-full shadow-inner" 
                  style={{ backgroundColor: owner?.color }}
                />
                
                {owner?.name}
                {isNarratorCard && <span className="text-amber-400 animate-pulse ml-1">★</span>}
              </div>

              {/* Votos recebidos */}
              <div className="flex gap-2 min-h-[32px] mt-1 bg-[#0A0A0A]/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
                {votesOnThis.length === 0 ? (
                  <span className="text-white/20 text-[10px] font-sans uppercase tracking-widest">Nenhum voto</span>
                ) : (
                  votesOnThis.map((voter) => voter && (
                    <div
                      key={voter.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/20 transition-transform hover:scale-110"
                      style={{ backgroundColor: voter.color }}
                      title={`${voter.name} votou aqui`}
                    >
                      {voter.name.charAt(0).toUpperCase()}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Placar atualizado */}
      <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center">
        <h3 className="text-white/40 font-sans text-xs uppercase tracking-[0.3em] font-bold mb-6">Pontuação Atual</h3>
        <div className="space-y-3 w-full">
          {[...gameState.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-colors border ${
                  index === 0 
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' 
                    : 'bg-[#1A1A1A]/40 border-white/5 hover:bg-white/5'
                }`}
              >
                <div className={`w-8 text-center font-cinzel font-bold text-lg ${index === 0 ? 'text-amber-400' : 'text-white/30'}`}>
                  {index + 1}°
                </div>
                
                <div
                  className="w-10 h-10 rounded-full shrink-0 shadow-lg border border-white/10 flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <span className={`font-cinzel font-bold tracking-wider ${index === 0 ? 'text-amber-100' : 'text-white'}`}>
                    {player.name}
                    {player.id === playerId && (
                      <span className="text-white/30 font-sans text-[10px] uppercase tracking-widest ml-2">(Você)</span>
                    )}
                  </span>
                </div>
                
                <div className={`font-sans font-black text-2xl tracking-tighter ${index === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-white/80'}`}>
                  {player.score}
                </div>
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
