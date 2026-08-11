import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import type { Card } from '../../types';
import { Button } from '../ui/Button';
import { GameCard } from './GameCard';

interface ClueModalProps {
  card: Card;
  mode?: 'narrator' | 'player' | 'voter';
  clueText?: string;
  onSubmit: (clue?: string) => void;
  onClose: () => void;
  onNextCard?: () => void;
  onPrevCard?: () => void;
  isMine?: boolean;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  card,
  mode = 'narrator',
  clueText,
  onSubmit,
  onClose,
  onNextCard,
  onPrevCard,
  isMine,
}) => {
  const [clue, setClue] = useState('');
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handleSubmit = () => {
    if (mode === 'narrator') {
      if (clue.trim()) {
        onSubmit(clue.trim());
      }
    } else {
      onSubmit();
    }
  };

  const arrowRightIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-90 ml-1"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-2xl" />

      {/* Modal panel + controls wrapper */}
      <div
        className="relative flex items-center justify-center w-full max-w-md md:max-w-lg animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-14 right-0 text-white/50 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:bg-white/10 transition-all z-[110] shadow-xl"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Card panel */}
        <div
          className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 w-full flex flex-col items-center transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
        >
          {/* Card display */}
          <div className="w-full flex justify-center mb-6 mt-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] px-2 sm:px-6">
            <GameCard
              card={card}
              size="full"
              className="ring-1 ring-white/10 w-full max-w-[320px] md:max-w-[360px]"
            />
          </div>

          {/* Bottom section: clue input or confirmation */}
          <div className="w-full space-y-4 md:space-y-5 px-1">
            {/* Header with Arrows */}
            <div className="flex items-center justify-between">
              <div className="w-10 sm:w-12">
                {onPrevCard && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevCard();
                    }}
                    className={`shrink-0 text-white/30 hover:${theme.accentText} w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all border border-white/10 ${theme.innerCardBg} shadow-xl group`}
                  >
                    <svg
                      className="group-hover:scale-110 transition-transform"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex-1 flex justify-center">
                {mode === 'narrator' ? (
                  <label
                    className={`text-[10px] uppercase tracking-[0.3em] font-sans font-bold ${theme.accentText}`}
                  >
                    {t.modals.clue.createClue}
                  </label>
                ) : clueText ? (
                  <p
                    className={`text-[9px] uppercase tracking-[0.4em] font-sans font-bold ${theme.accentText}`}
                  >
                    {t.modals.clue.theClueIs}
                  </p>
                ) : (
                  <p
                    className={`text-[9px] uppercase tracking-[0.4em] font-sans font-bold ${theme.accentText}`}
                  >
                    {t.modals.clue.cardSelection}
                  </p>
                )}
              </div>

              <div className="w-10 sm:w-12 flex justify-end">
                {onNextCard && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextCard();
                    }}
                    className={`shrink-0 text-white/30 hover:${theme.accentText} w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all border border-white/10 ${theme.innerCardBg} shadow-xl group`}
                  >
                    <svg
                      className="group-hover:scale-110 transition-transform"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {mode === 'narrator' ? (
              <>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    placeholder={t.modals.clue.cluePlaceholder}
                    className={`w-full rounded-xl px-4 py-3 sm:py-3.5 text-center text-base sm:text-lg italic outline-none transition-all font-cinzel ${theme.inputBg}`}
                    autoFocus
                    maxLength={100}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <p className="text-white/25 text-[8px] sm:text-[9px] text-center uppercase tracking-[0.2em] font-sans font-medium">
                    {t.modals.clue.tip}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon={clue.trim() ? arrowRightIcon : undefined}
                  iconPosition="right"
                  onClick={handleSubmit}
                  disabled={!clue.trim()}
                  className="w-full"
                >
                  {t.modals.clue.submitCardAndClue}
                </Button>
              </>
            ) : (
              <>
                {clueText && (
                  <div className="text-center mb-4">
                    <p
                      className={`text-xl sm:text-2xl md:text-3xl font-cinzel font-bold tracking-wider leading-tight ${theme.accentText}`}
                    >
                      "{clueText}"
                    </p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  icon={
                    !(mode === 'voter' && isMine) ? arrowRightIcon : undefined
                  }
                  iconPosition="right"
                  onClick={handleSubmit}
                  disabled={mode === 'voter' && isMine}
                  className="w-full"
                >
                  {mode === 'voter'
                    ? isMine
                      ? t.modals.clue.cannotVoteOwnCard
                      : t.modals.clue.confirmVote
                    : t.modals.clue.confirmCard}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
