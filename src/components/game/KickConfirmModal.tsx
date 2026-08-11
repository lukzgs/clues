import type React from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../ui/Button';

interface KickConfirmModalProps {
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const KickConfirmModal: React.FC<KickConfirmModalProps> = ({
  playerName,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className={`relative backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-[380px] w-full animate-zoom-in transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-cinzel font-bold text-lg md:text-xl text-center mb-2 tracking-wide">
          {t.modals.kick.title}
        </h3>

        {/* Message */}
        <p className="text-white/50 text-sm md:text-base text-center font-sans mb-6 leading-relaxed">
          {t.modals.kick.message(playerName)}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="glass"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            {t.modals.kick.cancel}
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={onConfirm}
            className="flex-1"
          >
            {t.modals.kick.remove}
          </Button>
        </div>
      </div>
    </div>
  );
};
