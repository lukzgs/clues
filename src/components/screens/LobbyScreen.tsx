import { useEffect, useState } from 'react';
import { GAME_CONFIG } from '../../constants';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import type {
  DeckOption,
  GameState,
  PhaseTimeouts,
  Player,
  VictoryCondition,
} from '../../types';
import { calculateMaxPlayers } from '../../utils/gameMath';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  GameOptions,
  LobbyActions,
  PlayerList,
  RoomCodeDisplay,
} from './lobby';

interface LobbyScreenProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  onStartGame: (
    victoryCondition: VictoryCondition,
    deckOption: DeckOption,
    phaseTimeouts: PhaseTimeouts,
    timerEnabled: boolean,
  ) => void;
  onUpdateSettings?: (
    victoryCondition: VictoryCondition,
    deckOption: DeckOption,
    phaseTimeouts: PhaseTimeouts,
    timerEnabled: boolean,
  ) => void;
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
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  onToggleSpectator,
  onRequestPlay,
}) => {
  const activePlayers = gameState.players.filter((p) => !p.isSpectator);
  const isHost = currentPlayer?.isHost ?? false;

  const { t } = useTranslation();
  const { theme } = useTheme();

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
  const [deckOption, setDeckOptionState] =
    useState<DeckOption>(defaultDeckOption);
  const [phaseTimeouts, setPhaseTimeouts] =
    useState<PhaseTimeouts>(defaultTimeouts);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(
    gameState.timerEnabled ?? true,
  );

  // Sync from server if not host (or on initial load)
  useEffect(() => {
    if (!isHost) {
      setVC(gameState.victoryCondition || defaultVC);
      setDeckOptionState(gameState.deckOption || defaultDeckOption);
      setPhaseTimeouts(gameState.phaseTimeouts || defaultTimeouts);
      setTimerEnabled(gameState.timerEnabled ?? true);
    }
  }, [
    gameState.victoryCondition,
    gameState.deckOption,
    gameState.phaseTimeouts,
    gameState.timerEnabled,
    isHost,
  ]);

  // Debounce sync to server (only for host)
  useEffect(() => {
    if (!isHost || !onUpdateSettings) return;

    const timer = setTimeout(() => {
      onUpdateSettings(vc, deckOption, phaseTimeouts, timerEnabled);
    }, 250);

    return () => clearTimeout(timer);
  }, [vc, deckOption, phaseTimeouts, timerEnabled, isHost, onUpdateSettings]);

  const updateVC = (patch: Partial<VictoryCondition>) => {
    setVC((prev) => {
      const next = { ...prev, ...patch };
      // At least one condition must stay enabled
      if (!next.scoreEnabled && !next.narratorRoundsEnabled) return prev;
      return next;
    });
  };

  const setDeckOption = (option: DeckOption) => {
    setDeckOptionState(option);
  };

  const maxPlayersForDeck = calculateMaxPlayers(deckOption, vc);
  const canStart =
    activePlayers.length >= GAME_CONFIG.MIN_PLAYERS &&
    activePlayers.length <= maxPlayersForDeck;
  const canAddBot = !!(
    GAME_CONFIG.ENABLE_BOTS &&
    gameState.players.length < GAME_CONFIG.MAX_CONNECTIONS &&
    activePlayers.length < maxPlayersForDeck &&
    onAddBot
  );

  const updateTimeout = (key: keyof PhaseTimeouts, value: number) => {
    setPhaseTimeouts((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(120, value)),
    }));
  };

  const handleStartGame = () => {
    onStartGame(vc, deckOption, phaseTimeouts, timerEnabled);
  };

  return (
    <div
      style={{ backgroundColor: theme.bgCanvas }}
      className="relative h-[100dvh] overflow-hidden flex items-center justify-center p-3 md:p-4 transition-colors duration-500"
    >
      <div className="fixed top-4 right-4 z-[300] flex items-center gap-2">
        <ThemeToggle className="relative! top-auto! right-auto! z-auto!" />
        <LanguageToggle className="relative! top-auto! right-auto! z-auto!" />
      </div>
      {/* Ambient Lighting — same as JoinScreen */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)',
        }}
      />
      <div
        className={`fixed top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0 transition-all duration-700 ${theme.ambientOrb}`}
      />

      <div className="w-full max-w-[1250px] z-10 h-full max-h-[95dvh] md:max-h-[90dvh] flex flex-col">
        <div
          className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 flex flex-col flex-1 min-h-0 transition-all duration-500 ${theme.cardBg}`}
          style={{
            animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0">
            {/* Left Panel: Game Options (Desktop Only) */}
            <div
              className="hidden lg:flex flex-col h-full min-h-0 bg-black/25 border border-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 transition-all duration-500"
              style={{
                animation:
                  'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
              }}
            >
              <GameOptions
                isHost={isHost}
                vc={vc}
                deckOption={deckOption}
                phaseTimeouts={phaseTimeouts}
                timerEnabled={timerEnabled}
                activePlayersCount={activePlayers.length}
                updateVC={updateVC}
                setDeckOption={setDeckOption}
                updateTimeout={updateTimeout}
                setTimerEnabled={setTimerEnabled}
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
                  onAddBot={onAddBot}
                  canAddBot={canAddBot}
                />
              </div>
            </div>

            {/* Right Panel: Room Code & Players */}
            <div
              className="flex flex-col h-full bg-black/25 border border-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 min-h-0 transition-all duration-500"
              style={{
                animation:
                  'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
              }}
            >
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
                  onAddBot={onAddBot}
                  canAddBot={canAddBot}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-4 md:bottom-6 w-full text-center z-0 pointer-events-none"
        style={{
          animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
        }}
      >
        <p className="text-white/20 text-[10px] font-sans tracking-wide">
          {t.common.copyright}
        </p>
      </div>

      {/* Mobile Options Modal */}
      {isMobileOptionsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMobileOptionsOpen(false)}
          ></div>
          <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-transparent backdrop-blur-xl z-20 pb-2 border-b border-white/10">
              <h3 className="text-amber-300 font-cinzel font-bold text-lg tracking-widest">
                {t.lobby.settings}
              </h3>
              <button
                onClick={() => setIsMobileOptionsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
              timerEnabled={timerEnabled}
              activePlayersCount={activePlayers.length}
              updateVC={updateVC}
              setDeckOption={setDeckOption}
              updateTimeout={updateTimeout}
              setTimerEnabled={setTimerEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};
