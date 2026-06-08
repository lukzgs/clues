import { useState, useEffect } from 'react';
import { GameState, Player, VictoryCondition, DeckOption, PhaseTimeouts } from '../../types';
import { GAME_CONFIG } from '../../constants';
import { useTranslation } from '../../i18n/index.tsx';
import { LanguageToggle } from '../ui/LanguageToggle';
import { GameOptions, PlayerList, RoomCodeDisplay, LobbyActions } from './lobby';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: (victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts) => void;
  onUpdateSettings?: (victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts) => void;
  onLeaveRoom: () => void;
  onAddBot?: () => void;
  onRemoveBot?: (botId: string) => void;
  onKickPlayer?: (targetId: string) => void;
  onToggleSpectator?: (targetId: string) => void;
  onRequestPlay?: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  gameState,
  currentPlayer,
  onStartGame,
  onUpdateSettings,
  onLeaveRoom,
  onRemoveBot,
  onKickPlayer,
  onToggleSpectator,
  onRequestPlay,
}) => {
  const activePlayers = gameState.players.filter(p => !p.isSpectator);
  const isHost = currentPlayer?.isHost ?? false;

  const { t } = useTranslation();

  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);

  // Valores padrão para robustez caso o estado venha desatualizado ou corrompido
  const defaultVC = gameState.victoryCondition || {
    scoreEnabled: true,
    targetScore: GAME_CONFIG.WINNING_SCORE,
    narratorRoundsEnabled: false,
    narratorRounds: GAME_CONFIG.DEFAULT_NARRATOR_ROUNDS,
  };
  const defaultDeckOption = gameState.deckOption || 'mixed';
  const defaultTimeouts = gameState.phaseTimeouts || {
    narrator: 60,
    othersChoosing: 45,
    voting: 30,
    results: 15,
  };

  // Local state for debouncing
  const [vc, setVC] = useState<VictoryCondition>(defaultVC);
  const [deckOption, setDeckOptionState] = useState<DeckOption>(defaultDeckOption);
  const [phaseTimeouts, setPhaseTimeouts] = useState<PhaseTimeouts>(defaultTimeouts);

  // Sync from server if not host (or on initial load)
  useEffect(() => {
    if (!isHost) {
      setVC(gameState.victoryCondition || defaultVC);
      setDeckOptionState(gameState.deckOption || defaultDeckOption);
      setPhaseTimeouts(gameState.phaseTimeouts || defaultTimeouts);
    }
  }, [gameState.victoryCondition, gameState.deckOption, gameState.phaseTimeouts, isHost]);

  // Debounce sync to server (only for host)
  useEffect(() => {
    if (!isHost || !onUpdateSettings) return;

    const timer = setTimeout(() => {
      onUpdateSettings(vc, deckOption, phaseTimeouts);
    }, 250);

    return () => clearTimeout(timer);
  }, [vc, deckOption, phaseTimeouts, isHost, onUpdateSettings]);

  const updateVC = (patch: Partial<VictoryCondition>) => {
    setVC(prev => {
      const next = { ...prev, ...patch };
      // At least one condition must stay enabled
      if (!next.scoreEnabled && !next.narratorRoundsEnabled) return prev;
      return next;
    });
  };

  const setDeckOption = (option: DeckOption) => {
    setDeckOptionState(option);
  };

  const maxPlayersForDeck = deckOption === 'mixed' ? GAME_CONFIG.MAX_PLAYERS_MIXED : GAME_CONFIG.MAX_PLAYERS;
  const canStart = activePlayers.length >= GAME_CONFIG.MIN_PLAYERS && activePlayers.length <= maxPlayersForDeck;

  const updateTimeout = (key: keyof PhaseTimeouts, value: number) => {
    setPhaseTimeouts(prev => ({ ...prev, [key]: Math.max(0, Math.min(120, value)) }));
  };

  const handleStartGame = () => {
    onStartGame(vc, deckOption, phaseTimeouts);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden flex items-center justify-center p-3 md:p-4">
      <LanguageToggle />
      {/* Ambient Lighting — same as JoinScreen */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
      />
      <div
        className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]"
      />

      <div className="w-full max-w-[1250px] z-10 h-full max-h-[95dvh] md:max-h-[90dvh] flex flex-col">
        <div
          className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 flex flex-col flex-1 min-h-0"
          style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 flex-1 min-h-0">
            
            {/* Left Panel: Game Options (Desktop Only) */}
            <div className="hidden lg:flex flex-col h-full min-h-0 bg-[#1A1A1A]/30 border border-white/10 rounded-3xl p-6 md:p-8" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
              <GameOptions 
                isHost={isHost}
                vc={vc}
                deckOption={deckOption}
                phaseTimeouts={phaseTimeouts}
                updateVC={updateVC}
                setDeckOption={setDeckOption}
                updateTimeout={updateTimeout}
              />
              <div className="mt-6 md:mt-8 shrink-0">
                <LobbyActions 
                  isHost={isHost}
                  canStart={canStart}
                  activePlayersCount={activePlayers.length}
                  maxPlayersForDeck={maxPlayersForDeck}
                  currentPlayer={currentPlayer}
                  onStartGame={handleStartGame}
                  setIsMobileOptionsOpen={setIsMobileOptionsOpen}
                  onToggleSpectator={onToggleSpectator}
                  onRequestPlay={onRequestPlay}
                  onLeaveRoom={onLeaveRoom}
                />
              </div>
            </div>

            {/* Right Panel: Room Code & Players */}
            <div className="flex flex-col h-full bg-[#1A1A1A]/30 border border-white/10 rounded-3xl p-6 md:p-8 min-h-0" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
              <RoomCodeDisplay roomCode={gameState.roomCode} />

              <PlayerList 
                gameState={gameState}
                currentPlayer={currentPlayer}
                maxPlayersForDeck={maxPlayersForDeck}
                onToggleSpectator={onToggleSpectator}
                onKickPlayer={onKickPlayer}
                onRemoveBot={onRemoveBot}
              />

              {/* Mobile Only: Actions */}
              <div className="lg:hidden mt-6 md:mt-8">
                <LobbyActions 
                  isHost={isHost}
                  canStart={canStart}
                  activePlayersCount={activePlayers.length}
                  maxPlayersForDeck={maxPlayersForDeck}
                  currentPlayer={currentPlayer}
                  onStartGame={handleStartGame}
                  setIsMobileOptionsOpen={setIsMobileOptionsOpen}
                  onToggleSpectator={onToggleSpectator}
                  onRequestPlay={onRequestPlay}
                  onLeaveRoom={onLeaveRoom}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 md:bottom-6 w-full text-center z-0 pointer-events-none" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
        <p className="text-white/20 text-[10px] font-sans tracking-wide">
          {t.common.copyright}
        </p>
      </div>

      {/* Mobile Options Modal */}
      {isMobileOptionsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileOptionsOpen(false)}></div>
          <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-transparent backdrop-blur-xl z-20 pb-2 border-b border-white/10">
              <h3 className="text-amber-300 font-cinzel font-bold text-lg tracking-widest">{t.lobby.settings}</h3>
              <button 
                onClick={() => setIsMobileOptionsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <GameOptions 
              isHost={isHost}
              vc={vc}
              deckOption={deckOption}
              phaseTimeouts={phaseTimeouts}
              updateVC={updateVC}
              setDeckOption={setDeckOption}
              updateTimeout={updateTimeout}
            />
          </div>
        </div>
      )}
    </div>
  );
};

