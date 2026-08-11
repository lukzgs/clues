import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n/index.tsx';
import { useTheme } from '../../../providers/ThemeProvider';

interface RoomCodeDisplayProps {
  roomCode: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({
  roomCode,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
    <div className="text-center mb-6 w-full">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-bold">
        {t.lobby.roomCode}
      </p>
      <div className="relative inline-flex items-center justify-center max-w-full">
        <div
          className={`rounded-2xl px-4 sm:px-6 md:px-8 py-2 md:py-3 inline-flex items-center justify-center border border-white/15 shadow-inner transition-all duration-300 ${theme.accentBgLight}`}
        >
          <span
            className={`text-xl sm:text-2xl md:text-3xl font-cinzel font-bold tracking-[0.15em] ml-1 ${theme.accentText}`}
          >
            {roomCode}
          </span>
        </div>
        <div className="absolute left-full ml-2 sm:ml-3 md:ml-4 flex items-center">
          <button
            onClick={handleCopyLink}
            className={`p-2 sm:p-2.5 md:p-3 rounded-xl transition-all duration-300 border shadow-sm ${
              copied
                ? 'text-green-400 border-green-500/30 bg-green-500/10 scale-105'
                : `text-white/60 ${theme.innerCardBg} hover:${theme.accentText} hover:border-white/20 hover:scale-105`
            }`}
            title="Copy room link"
            aria-label="Copy room link"
          >
            {copied ? (
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
