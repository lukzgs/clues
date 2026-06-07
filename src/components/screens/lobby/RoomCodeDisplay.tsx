import React, { useState } from 'react';
import { useTranslation } from '../../../i18n/index.tsx';

interface RoomCodeDisplayProps {
  roomCode: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ roomCode }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="text-center mb-10 w-full">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-bold">
        {t.lobby.roomCode}
      </p>
      <div className="relative inline-flex items-center justify-center max-w-full">
        <div className="bg-[#1A1A1A]/60 rounded-2xl px-5 sm:px-8 md:px-12 py-3.5 md:py-5 inline-flex items-center justify-center border border-white/10 shadow-inner">
          <span className="text-2xl sm:text-3xl md:text-4xl font-cinzel font-bold text-amber-300 tracking-[0.15em] ml-1">
            {roomCode}
          </span>
        </div>
        <div className="absolute left-full ml-2 sm:ml-3 md:ml-4 flex items-center">
          <button
            onClick={handleCopyLink}
            className={`p-2.5 sm:p-3 md:p-3.5 rounded-xl transition-all duration-300 border shadow-sm ${
              copied
                ? 'text-green-400 border-green-500/30 bg-green-500/10 scale-105'
                : 'text-white/40 border-white/10 bg-[#1A1A1A]/60 hover:text-amber-300 hover:border-white/20 hover:bg-[#1A1A1A]/80 hover:scale-105'
            }`}
            title="Copy room link"
            aria-label="Copy room link"
          >
            {copied ? (
              <svg className="w-5 h-5 md:w-[22px] md:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 md:w-[22px] md:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
