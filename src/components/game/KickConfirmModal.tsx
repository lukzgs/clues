import React from 'react';
import { useTranslation } from '../../i18n/index.tsx';

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
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-[380px] w-full animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
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
          <button
            onClick={onCancel}
            className="flex-1 py-3 md:py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-sm md:text-base transition-all duration-200 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          >
            {t.modals.kick.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 md:py-3.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-sm md:text-base transition-all duration-200 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300"
          >
            {t.modals.kick.remove}
          </button>
        </div>
      </div>
    </div>
  );
};
