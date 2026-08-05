import React from 'react';
import { VictoryCondition, DeckOption, PhaseTimeouts } from '../../../types';
import { calculateMaxNarratorRounds } from '../../../utils/gameMath';
import { GAME_CONFIG } from '../../../constants';
import { useTranslation } from '../../../i18n/index.tsx';
import { useTheme } from '../../../providers/ThemeProvider';

interface GameOptionsProps {
  isHost: boolean;
  vc: VictoryCondition;
  deckOption: DeckOption;
  phaseTimeouts: PhaseTimeouts;
  timerEnabled: boolean;
  updateVC: (patch: Partial<VictoryCondition>) => void;
  setDeckOption: (option: DeckOption) => void;
  updateTimeout: (key: keyof PhaseTimeouts, value: number) => void;
  setTimerEnabled: (enabled: boolean) => void;
  activePlayersCount: number;
}

export const GameOptions: React.FC<GameOptionsProps> = ({
  isHost,
  vc,
  deckOption,
  phaseTimeouts,
  timerEnabled,
  updateVC,
  setDeckOption,
  updateTimeout,
  setTimerEnabled,
  activePlayersCount
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const maxRounds = calculateMaxNarratorRounds(deckOption, activePlayersCount);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2 custom-scrollbar">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-sans font-bold shrink-0">
        {t.lobby.gameOptions}
      </p>

      <div className="space-y-4">
        {/* Score condition */}
        {isHost ? (
          <div className={`rounded-2xl border transition-all duration-300 ${
            vc.scoreEnabled
              ? `${theme.innerCardBg} ${theme.accentBorder}`
              : 'bg-black/20 border-white/5 opacity-50'
          }`}>
            <div className="flex items-center justify-between p-3 pb-2">
              <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.scoreEnabled ? 'text-white' : 'text-white/30'}`}>
                {t.lobby.byScore}
              </span>
              <button
                onClick={() => updateVC({ scoreEnabled: !vc.scoreEnabled })}
                className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                  vc.scoreEnabled ? theme.primaryGradient : 'bg-white/10'
                }`}
                aria-label="Toggle score condition"
              >
                <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  vc.scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {vc.scoreEnabled && (
              <div className="px-3 pb-3 pt-0.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-sans font-bold">{t.lobby.firstToReach}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      step={5}
                      value={vc.targetScore}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) updateVC({ targetScore: v });
                      }}
                      onBlur={() => updateVC({ targetScore: Math.max(10, Math.min(100, vc.targetScore)) })}
                      className={`w-14 md:w-16 rounded-lg px-1.5 py-1 ${theme.inputBg} font-cinzel font-bold text-base md:text-lg text-center tabular-nums outline-none transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <span className="text-white/30 text-[9px] md:text-[10px] tracking-widest font-sans font-bold uppercase">{t.lobby.points}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.max(10, Math.min(100, vc.targetScore))}
                  onChange={(e) => updateVC({ targetScore: Number(e.target.value) })}
                  className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                  style={{ accentColor: 'currentColor' }}
                />
                <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                  <span>10</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl border transition-all duration-300 ${
            vc.scoreEnabled
              ? `${theme.innerCardBg} ${theme.accentBorder}`
              : 'bg-black/20 border-white/5 opacity-50'
          }`}>
            <div className="flex items-center justify-between p-3">
              <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.scoreEnabled ? 'text-white' : 'text-white/30'}`}>
                {t.lobby.byScore}
              </span>
              {vc.scoreEnabled && (
                <span className={`w-12 h-7 md:w-14 md:h-8 flex items-center justify-center ${theme.innerCardBg} border border-white/10 rounded-lg ${theme.accentText} font-cinzel font-bold text-sm md:text-base tabular-nums`}>
                  {vc.targetScore}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Narrator rounds condition */}
        {isHost ? (
          <div className={`rounded-2xl border transition-all duration-300 ${
            vc.narratorRoundsEnabled
              ? `${theme.innerCardBg} ${theme.accentBorder}`
              : 'bg-black/20 border-white/5 opacity-50'
          }`}>
            <div className="flex items-center justify-between p-3 pb-2">
              <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.narratorRoundsEnabled ? 'text-white' : 'text-white/30'}`}>
                {t.lobby.byRounds}
              </span>
              <button
                onClick={() => updateVC({ narratorRoundsEnabled: !vc.narratorRoundsEnabled })}
                className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                  vc.narratorRoundsEnabled ? theme.primaryGradient : 'bg-white/10'
                }`}
                aria-label="Toggle rounds condition"
              >
                <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  vc.narratorRoundsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {vc.narratorRoundsEnabled && (
              <div className="px-3 pb-3 pt-0.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-sans font-bold">{t.lobby.eachPlayerNarrates}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={maxRounds}
                      step={1}
                      value={vc.narratorRounds}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) updateVC({ narratorRounds: v });
                      }}
                      onBlur={() => updateVC({ narratorRounds: Math.max(1, Math.min(maxRounds, vc.narratorRounds)) })}
                      className={`w-14 md:w-16 rounded-lg px-1.5 py-1 ${theme.inputBg} font-cinzel font-bold text-base md:text-lg text-center tabular-nums outline-none transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <span className="text-white/30 text-[9px] md:text-[10px] tracking-widest font-sans font-bold uppercase">{t.lobby.times}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxRounds}
                  step={1}
                  value={Math.max(1, Math.min(maxRounds, vc.narratorRounds))}
                  onChange={(e) => updateVC({ narratorRounds: Number(e.target.value) })}
                  className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                  style={{ accentColor: 'currentColor' }}
                />
                <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                  <span>1x</span>
                  <span>{maxRounds}x</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl border transition-all duration-300 ${
            vc.narratorRoundsEnabled
              ? `${theme.innerCardBg} ${theme.accentBorder}`
              : 'bg-black/20 border-white/5 opacity-50'
          }`}>
            <div className="flex items-center justify-between p-3">
              <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.narratorRoundsEnabled ? 'text-white' : 'text-white/30'}`}>
                {t.lobby.byRounds}
              </span>
              {vc.narratorRoundsEnabled && (
                <span className={`w-12 h-7 md:w-14 md:h-8 flex items-center justify-center ${theme.innerCardBg} border border-white/10 rounded-lg ${theme.accentText} font-cinzel font-bold text-sm md:text-base tabular-nums`}>
                  {vc.narratorRounds}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Info when both enabled */}
        {vc.scoreEnabled && vc.narratorRoundsEnabled && (
          <p className="text-white/30 text-[10px] md:text-[11px] text-center px-4 font-sans font-bold uppercase tracking-[0.15em] mt-3">
            {t.lobby.bothConditions}
          </p>
        )}

        {/* Warning about large player counts */}
        {activePlayersCount >= 8 && (
          <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 ${theme.accentBgLight} ${theme.accentBorder}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${theme.accentText} shrink-0 mt-0.5`}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <p className="text-white/80 text-[10px] md:text-xs font-sans tracking-wide leading-relaxed">
              Com <strong>{activePlayersCount} jogadores</strong> ativos, o máximo de opções foi automaticamente reduzido para garantir que o baralho tenha cartas suficientes para a partida inteira.
            </p>
          </div>
        )}
      </div>

      {/* Deck Selection */}
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-sans font-bold">
          {t.lobby.cardPool}
        </p>
        <div className={`flex border rounded-xl p-1 relative z-0 transition-all duration-300 ${theme.innerCardBg}`}>
          <div
            className={`absolute inset-y-1 rounded-lg transition-all duration-300 z-[-1] ${theme.accentBgLight} border ${theme.accentBorder}`}
            style={{
              width: 'calc(33.333% - 4px)',
              left: deckOption === 'original' ? '4px' : deckOption === 'new' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
            }}
          />
          {(['original', 'new', 'mixed'] as DeckOption[]).map((option) => (
            <button
              key={option}
              onClick={() => isHost && setDeckOption(option)}
              disabled={!isHost}
              className={`flex-1 py-2 md:py-2.5 text-[10px] md:text-sm font-cinzel font-bold tracking-widest transition-colors duration-200 uppercase rounded-lg
                ${deckOption === option ? theme.accentText : 'text-white/40 hover:text-white/80'}
                ${!isHost && 'cursor-default'}
              `}
            >
              {option === 'original' ? t.lobby.original : option === 'new' ? t.lobby.new : t.lobby.mixed}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Timeouts */}
      {(isHost || timerEnabled) && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-bold">
              {t.lobby.phaseTimeouts}
            </p>
            {isHost && (
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                  timerEnabled ? theme.primaryGradient : 'bg-white/10'
                }`}
                aria-label="Toggle phase timeouts"
              >
                <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  timerEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            )}
          </div>

          {timerEnabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { key: 'narrator' as keyof PhaseTimeouts, label: t.lobby.phaseNarrator },
                { key: 'othersChoosing' as keyof PhaseTimeouts, label: t.lobby.phaseChoosing },
                { key: 'voting' as keyof PhaseTimeouts, label: t.lobby.phaseVoting },
                { key: 'results' as keyof PhaseTimeouts, label: t.lobby.phaseResults },
              ].map(({ key, label }) => (
                <div key={key} className={`border rounded-xl p-3 transition-all duration-300 ${theme.innerCardBg}`}>
                  <div className={`flex items-center justify-between ${isHost ? 'mb-2' : ''}`}>
                    <span className="text-xs md:text-sm font-cinzel font-bold text-white/80">{label}</span>
                    {isHost ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          step={1}
                          value={phaseTimeouts[key]}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isNaN(v)) {
                              updateTimeout(key, v);
                            }
                          }}
                          onBlur={() => updateTimeout(key, phaseTimeouts[key])}
                          className={`w-14 md:w-16 rounded-lg px-1.5 py-1 ${theme.inputBg} font-cinzel font-bold text-base md:text-lg text-center tabular-nums outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <span className="text-white/30 text-[9px] md:text-[10px] tracking-widest font-sans font-bold uppercase">{t.lobby.sec}</span>
                      </div>
                    ) : (
                      <span className={`w-12 h-7 md:w-14 md:h-8 flex items-center justify-center ${theme.innerCardBg} border border-white/10 rounded-lg ${theme.accentText} font-cinzel font-bold text-sm md:text-base tabular-nums`}>
                        {phaseTimeouts[key]}
                      </span>
                    )}
                  </div>
                  {isHost && (
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={1}
                      value={phaseTimeouts[key]}
                      onChange={(e) => updateTimeout(key, Number(e.target.value))}
                      className={`w-full h-2 rounded-full cursor-pointer bg-white/10 ${theme.accentText}`}
                      style={{ accentColor: 'currentColor' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
