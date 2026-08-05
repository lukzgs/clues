import { useState } from 'react';
import { GameState } from '../../types';
import { GameCard } from './GameCard';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../ui/Button';

interface ResultsViewProps {
  gameState: GameState;
  playerId: string;
  onNextRound: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (targetId: string) => void;
  isHost?: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  gameState,
  playerId,
  onNextRound,
  onLeaveRoom,
  onKickPlayer,
  isHost = false,
}) => {
  const [mobileView, setMobileView] = useState<'row' | 'grid-1' | 'grid-2'>('grid-2');
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const narrator = gameState.players[gameState.narratorIndex];
  const currentPlayer = gameState.players.find(p => p.id === playerId);

  return (
    <div className="flex flex-col items-center gap-10 md:gap-12 py-6 md:py-8 animate-fade-in w-full max-w-7xl mx-auto">
      {/* Pista */}
      <div className={`text-center backdrop-blur-2xl border px-10 md:px-14 py-6 rounded-2xl md:rounded-[2rem] inline-flex flex-col items-center justify-center w-auto min-w-[280px] max-w-[90vw] mx-auto transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-2 font-sans font-bold">
          {t.results.theClueWas}
        </p>
        <h2 className={`text-2xl md:text-4xl font-cinzel font-bold tracking-wider ${theme.accentText}`}>
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Cartas com resultados */}
      <div className="w-full">
        {/* Toggle de visualização Mobile */}
        <div className="md:hidden flex justify-between items-center px-4 mb-4">
          <span className="text-white/50 text-[10px] uppercase font-sans font-bold tracking-[0.2em]">{t.results.tableResults}</span>
          <div className={`flex rounded-xl border border-white/10 p-1 backdrop-blur-sm ${theme.innerCardBg}`}>
            <button
              onClick={() => setMobileView('row')}
              className={`p-2 rounded-lg transition-all ${mobileView === 'row' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver em carrossel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="18" rx="1" ry="1"/><rect x="18" y="5" width="3" height="14" rx="1" ry="1"/><rect x="3" y="5" width="3" height="14" rx="1" ry="1"/></svg>
            </button>
            <button
              onClick={() => setMobileView('grid-2')}
              className={`p-2 rounded-lg transition-all ${mobileView === 'grid-2' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver 2 por linha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="14" width="7" height="7" rx="1" ry="1"/><rect x="3" y="14" width="7" height="7" rx="1" ry="1"/></svg>
            </button>
            <button
              onClick={() => setMobileView('grid-1')}
              className={`p-2 rounded-lg transition-all ${mobileView === 'grid-1' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver 1 por linha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="5" rx="1" ry="1"/><rect x="4" y="13" width="16" height="5" rx="1" ry="1"/></svg>
            </button>
          </div>
        </div>

        <div className={`
          w-full px-4 md:px-0
          ${mobileView === 'row' ? 'flex overflow-x-auto snap-x snap-mandatory pb-6 gap-6 hide-scrollbar -mx-4 px-8' : ''}
          ${mobileView === 'grid-2' ? 'grid grid-cols-2 gap-4 pb-4' : ''}
          ${mobileView === 'grid-1' ? 'flex flex-col gap-8 pb-4' : ''}
          md:flex md:flex-wrap md:justify-center md:gap-6 md:w-full md:overflow-visible md:px-8 md:max-w-7xl md:mx-auto
        `}>
          {gameState.tableCards.map((tableCard) => {
            const owner = gameState.players.find(p => p.id === tableCard.playerId);
            const isNarratorCard = tableCard.playerId === narrator?.id;

            // Conta votos nesta carta
            const votesOnThis = Object.entries(gameState.votes)
              .filter(([_, orderId]) => orderId === tableCard.orderId)
              .map(([voterId]) => gameState.players.find(p => p.id === voterId));

            return (
              <div 
                key={tableCard.orderId} 
                className={`
                  flex flex-col items-center gap-4 shrink-0
                  ${mobileView === 'row' ? 'w-[75vw] max-w-[280px] snap-center snap-always' : ''}
                  ${mobileView === 'grid-2' ? 'w-full' : ''}
                  ${mobileView === 'grid-1' ? 'w-full max-w-[360px] mx-auto' : ''}
                  ${!mobileView || mobileView === 'row' ? 'md:w-[calc(20%-1.2rem)] max-w-[224px]' : 'md:w-[calc(20%-1.2rem)] max-w-[224px]'}
                `}
              >
                {/* Dono da carta */}
                <div
                  className={`px-4 py-2 z-10 w-[90%] md:w-auto text-center truncate rounded-full text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-xl border ${
                    isNarratorCard 
                      ? `${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}` 
                      : `${theme.innerCardBg} text-white/70 border-white/10`
                  }`}
                >
                  {/* Indicador de cor do jogador */}
                  <div 
                    className="w-3 h-3 rounded-full shadow-inner shrink-0" 
                    style={{ backgroundColor: owner?.color }}
                  />
                  
                  <span className="truncate">{owner?.name}</span>
                  {isNarratorCard && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${theme.accentText} animate-pulse ml-1 shrink-0`}>
                      <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                      <line x1="2" y1="19" x2="22" y2="19" />
                    </svg>
                  )}
                </div>

                <div className="relative w-full flex justify-center px-1">
                  <GameCard
                    card={tableCard.card}
                    size="full"
                    className={`
                      ${isNarratorCard ? `ring-1 ${theme.accentBorder}` : "opacity-80"}
                      ${mobileView !== 'row' ? '!w-full !h-auto aspect-[2/3]' : '!w-full !h-auto aspect-[2/3]'}
                    `}
                  />
                </div>

                {/* Votos recebidos */}
                {votesOnThis.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 min-h-[32px] w-full px-2">
                    {votesOnThis.map((voter) => voter && (
                      <div
                        key={voter.id}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex shrink-0 items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/20 transition-transform hover:scale-110"
                        style={{ backgroundColor: voter.color }}
                        title={`${voter.name} votou aqui`}
                      >
                        {voter.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-lg space-y-3 mt-4 mb-4">
        {!(gameState.playersWhoReadied ?? []).includes(playerId) && !currentPlayer?.isSpectator ? (
          <Button
            variant="primary"
            size="lg"
            onClick={onNextRound}
            className="w-full"
          >
            {gameState.winner ? t.results.finishGame : t.results.nextRound}
          </Button>
        ) : currentPlayer?.isSpectator ? (
          <div className={`text-center py-4 text-white/40 rounded-xl border border-white/10 font-sans text-sm tracking-wide flex items-center justify-center gap-2 ${theme.innerCardBg}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400/60"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {t.results.watchingSpectator}
          </div>
        ) : (
          <div className={`flex items-center justify-center py-4 px-6 text-white/60 rounded-xl border border-white/10 shadow-inner ${theme.innerCardBg}`}>
            <span className={`w-2 h-2 rounded-full inline-block animate-pulse mr-3 shrink-0 ${theme.accentText} bg-current`} />
            <span className="font-cinzel text-xs md:text-sm uppercase tracking-[0.1em] font-bold mt-0.5 truncate">
              {t.results.waitingPlayers}
            </span>
            <span className={`text-[10px] md:text-xs uppercase tracking-widest ml-3 font-black shrink-0 border border-white/10 px-2 py-0.5 rounded-full ${theme.accentText}`}>
              {(gameState.playersWhoReadied ?? []).length}/{gameState.players.filter(p => !p.isSpectator).length}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={onLeaveRoom}
          className="w-full"
        >
          {t.results.leaveRoom}
        </Button>
      </div>

      {/* Placar atualizado */}
      <div className={`backdrop-blur-2xl border rounded-[2rem] p-8 w-full max-w-lg shadow-2xl flex flex-col items-center transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}>
        <h3 className="text-white/40 font-sans text-xs uppercase tracking-[0.3em] font-bold mb-6">{t.results.currentScore}</h3>
        <div className="space-y-3 w-full">
          {[...gameState.players]
            .filter(p => !p.isSpectator)
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 md:px-5 rounded-2xl transition-colors border w-full overflow-hidden ${
                  player.id === playerId 
                    ? `${theme.innerCardBg} ${theme.accentBorder}` 
                    : `${theme.innerCardBg} opacity-80 hover:opacity-100`
                }`}
              >
                <div className={`w-6 md:w-8 text-center font-cinzel font-bold text-base md:text-lg shrink-0 ${index === 0 ? theme.accentText : 'text-white/30'}`}>
                  {index + 1}°
                </div>
                
                <div
                  className="w-10 h-10 rounded-full shrink-0 shadow-lg border border-white/10 flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-cinzel font-bold tracking-wider truncate ${index === 0 ? theme.accentText : 'text-white'}`}>
                    {player.name}
                    {player.id === playerId && (
                      <span className="text-white/30 font-sans text-[10px] uppercase tracking-widest ml-2 inline-block relative -top-[1px]">({t.common.you})</span>
                    )}
                  </div>
                </div>

                {/* Kick button — host only */}
                {isHost && player.id !== playerId && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 mr-2"
                    title="Remover jogador"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
                
                <div className={`font-sans font-black text-2xl tracking-tighter shrink-0 ${index === 0 ? theme.accentText : 'text-white/80'}`}>
                  {player.score}
                </div>

                {/* Ready Indicator */}
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                  (gameState.playersWhoReadied ?? []).includes(player.id)
                    ? `${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`
                    : 'bg-black/40 text-white/15 border-white/5'
                }`}>
                  {(gameState.playersWhoReadied ?? []).includes(player.id) ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-3 md:h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </div>
              </div>

            ))}
        </div>
      </div>

    </div>
  );
};
