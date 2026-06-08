import React from 'react';
import { VictoryCondition, DeckOption, PhaseTimeouts } from '../../../types';
import { GAME_CONFIG } from '../../../constants';
import { useTranslation } from '../../../i18n/index.tsx';

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
  setTimerEnabled
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-sans font-bold shrink-0">
        {t.lobby.gameOptions}
      </p>

      <div className="space-y-4">
        {/* Score condition */}
        <div className={`rounded-2xl border transition-all duration-300 ${
          vc.scoreEnabled
            ? 'bg-[#1A1A1A]/50 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
            : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
        }`}>
          <div className="flex items-center justify-between p-3 pb-2">
            <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.scoreEnabled ? 'text-white' : 'text-white/30'}`}>
              {t.lobby.byScore}
            </span>
            {isHost ? (
              <button
                onClick={() => updateVC({ scoreEnabled: !vc.scoreEnabled })}
                className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                  vc.scoreEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10'
                }`}
                aria-label="Toggle score condition"
              >
                <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  vc.scoreEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            ) : (
              <span className="text-white/30 text-[9px] md:text-[10px] font-sans font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">{vc.scoreEnabled ? t.lobby.on : t.lobby.off}</span>
            )}
          </div>

          {vc.scoreEnabled && (
            <div className="px-3 pb-3 pt-0.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-sans font-bold">{t.lobby.firstToReach}</span>
                <div className="flex items-center gap-1.5">
                  {isHost ? (
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
                      className="w-14 md:w-16 bg-[#1A1A1A]/80 border border-white/20 rounded-lg px-1.5 py-1 text-amber-300 font-cinzel font-bold text-base md:text-lg text-center tabular-nums outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span className="bg-[#1A1A1A]/80 border border-white/10 rounded-lg px-3 py-1.5 text-amber-300/90 font-cinzel font-bold text-base md:text-lg tabular-nums">{vc.targetScore}</span>
                  )}
                  <span className="text-white/30 text-[9px] md:text-[10px] tracking-widest font-sans font-bold uppercase">{t.lobby.points}</span>
                </div>
              </div>
              {isHost && (
                <>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={Math.max(10, Math.min(100, vc.targetScore))}
                    onChange={(e) => updateVC({ targetScore: Number(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                  />
                  <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Narrator rounds condition */}
        <div className={`rounded-2xl border transition-all duration-300 ${
          vc.narratorRoundsEnabled
            ? 'bg-[#1A1A1A]/50 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
            : 'bg-[#1A1A1A]/20 border-white/5 opacity-50'
        }`}>
          <div className="flex items-center justify-between p-3 pb-2">
            <span className={`text-xs md:text-base font-cinzel font-bold tracking-wider ${vc.narratorRoundsEnabled ? 'text-white' : 'text-white/30'}`}>
              {t.lobby.byRounds}
            </span>
            {isHost ? (
              <button
                onClick={() => updateVC({ narratorRoundsEnabled: !vc.narratorRoundsEnabled })}
                className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                  vc.narratorRoundsEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10'
                }`}
                aria-label="Toggle rounds condition"
              >
                <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                  vc.narratorRoundsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            ) : (
              <span className="text-white/30 text-[9px] md:text-[10px] font-sans font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">{vc.narratorRoundsEnabled ? t.lobby.on : t.lobby.off}</span>
            )}
          </div>

          {vc.narratorRoundsEnabled && (
            <div className="px-3 pb-3 pt-0.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-sans font-bold">{t.lobby.eachPlayerNarrates}</span>
                <div className="flex items-center gap-1.5">
                  {isHost ? (
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={vc.narratorRounds}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) updateVC({ narratorRounds: v });
                      }}
                      onBlur={() => updateVC({ narratorRounds: Math.max(1, Math.min(5, vc.narratorRounds)) })}
                      className="w-14 md:w-16 bg-[#1A1A1A]/80 border border-white/20 rounded-lg px-1.5 py-1 text-amber-300 font-cinzel font-bold text-base md:text-lg text-center tabular-nums outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span className="bg-[#1A1A1A]/80 border border-white/10 rounded-lg px-3 py-1.5 text-amber-300/90 font-cinzel font-bold text-base md:text-lg tabular-nums">{vc.narratorRounds}</span>
                  )}
                  <span className="text-white/30 text-[9px] md:text-[10px] tracking-widest font-sans font-bold uppercase">{t.lobby.times}</span>
                </div>
              </div>
              {isHost && (
                <>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={Math.max(1, Math.min(5, vc.narratorRounds))}
                    onChange={(e) => updateVC({ narratorRounds: Number(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                  />
                  <div className="flex justify-between text-[10px] md:text-[11px] text-white/30 mt-2 font-sans font-medium">
                    <span>1x</span>
                    <span>5x</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info when both enabled */}
        {vc.scoreEnabled && vc.narratorRoundsEnabled && (
          <p className="text-white/30 text-[10px] md:text-[11px] text-center px-4 font-sans font-bold uppercase tracking-[0.15em] mt-3">
            {t.lobby.bothConditions}
          </p>
        )}
      </div>

      {/* Deck Selection */}
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-sans font-bold">
          {t.lobby.cardPool}
        </p>
        <div className="flex bg-[#1A1A1A]/50 border border-white/10 rounded-xl p-1 relative z-0">
          <div
            className="absolute inset-y-1 bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all duration-300 z-[-1] shadow-[0_0_10px_rgba(245,158,11,0.1)]"
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
                ${deckOption === option ? 'text-amber-300' : 'text-white/40 hover:text-white/80'}
                ${!isHost && 'cursor-default'}
              `}
            >
              {option === 'original' ? t.lobby.original : option === 'new' ? t.lobby.new : t.lobby.mixed}
            </button>
          ))}
        </div>
        {!isHost && (
          <p className="text-center mt-3 text-[10px] md:text-xs font-cinzel font-bold uppercase tracking-widest text-white/30">
            {t.lobby.hostChoosingDeck}
          </p>
        )}
      </div>

      {/* Phase Timeouts */}
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-bold">
            {t.lobby.phaseTimeouts}
          </p>
          {isHost ? (
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`relative w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors duration-300 ${
                timerEnabled ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-white/10'
              }`}
              aria-label="Toggle phase timeouts"
            >
              <span className={`absolute top-0.5 left-0.5 md:top-0.5 md:left-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                timerEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          ) : (
            <span className="text-white/30 text-[9px] md:text-[10px] font-sans font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">
              {timerEnabled ? t.lobby.on : t.lobby.off}
            </span>
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
              <div key={key} className="bg-[#1A1A1A]/30 border border-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-cinzel font-bold text-white/80">{label}</span>
                  <div className="flex items-center gap-1.5 bg-[#1A1A1A]/80 border border-white/10 rounded-lg px-2 py-1">
                    {isHost ? (
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
                        className="w-10 md:w-12 bg-transparent text-amber-300 font-cinzel font-bold text-sm md:text-base tabular-nums outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <span className="text-amber-300 font-cinzel font-bold text-sm md:text-base tabular-nums">{phaseTimeouts[key]}</span>
                    )}
                    <span className="text-white/30 text-[9px] md:text-[10px] font-sans uppercase font-bold tracking-widest">{t.lobby.sec}</span>
                  </div>
                </div>
                {isHost ? (
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={1}
                    value={phaseTimeouts[key]}
                    onChange={(e) => updateTimeout(key, Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                  />
                ) : (
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-amber-500/30 transition-all duration-300" style={{ width: `${(phaseTimeouts[key] / 120) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
