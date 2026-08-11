import type React from 'react';
import { useState } from 'react';
import { useTheme } from '../../../providers/ThemeProvider';
import { LanguageToggle } from '../../ui/LanguageToggle';
import { ThemeToggle } from '../../ui/ThemeToggle';

interface GameHeaderProps {
  roomCode: string;
  onLeaveRoom: () => void;
  phaseLabel: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomCode,
  onLeaveRoom,
  phaseLabel,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    <div
      className={`w-full backdrop-blur-2xl border-b border-white/10 p-3 md:px-6 flex items-center justify-between shrink-0 shadow-lg gap-2 md:gap-4 select-none relative ${theme.cardBg}`}
    >
      {/* Left section: Logo + Game Phase */}
      <div className="flex items-center gap-2.5 md:gap-3.5 md:w-[304px] md:shrink-0">
        {/* Logo (Hidden on mobile) */}
        <div
          className={`hidden sm:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border ${theme.accentBorder} ${theme.accentBgLight} shrink-0`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${theme.accentText} md:w-5 md:h-5`}
          >
            <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
            <line x1="2" y1="19" x2="22" y2="19" />
          </svg>
        </div>

        {/* Game Phase Description */}
        <span className="text-white font-cinzel font-bold text-xs xs:text-sm md:text-lg tracking-wider capitalize leading-none truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none select-text">
          {phaseLabel}
        </span>
      </div>

      {/* Center section: Room Code + Copy Link Button */}
      <div className="flex-1 flex items-center justify-center gap-1.5 md:gap-2">
        <div
          className={`rounded-xl border border-white/15 w-28 h-10 flex items-center justify-center font-cinzel font-bold text-sm md:text-base ${theme.accentText} tracking-[0.15em] shrink-0 leading-none ${theme.innerCardBg}`}
        >
          {roomCode}
        </div>

        <button
          onClick={handleCopyLink}
          className={`w-10 h-10 rounded-xl transition-all duration-300 border shadow-sm shrink-0 flex items-center justify-center ${
            copied
              ? 'text-green-400 border-green-500/30 bg-green-500/10 scale-105'
              : `text-white/40 border-white/10 ${theme.innerCardBg} hover:${theme.accentText} hover:border-white/20 hover:scale-105`
          }`}
          title="Copiar link da sala"
          aria-label="Copiar link da sala"
        >
          {copied ? (
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4"
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
              className="w-3.5 h-3.5 md:w-4 md:h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Right section: Theme Switch + Language Switch + Exit Button */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 flex-row md:absolute md:right-6">
        <ThemeToggle className="relative !static !top-auto !right-auto shadow-none flex-shrink-0" />
        <LanguageToggle className="relative !static !top-auto !right-auto shadow-none flex-shrink-0" />

        <button
          onClick={onLeaveRoom}
          className="w-10 h-10 rounded-xl transition-all duration-300 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 hover:border-red-500/40 shadow-sm shrink-0 flex items-center justify-center"
          title="Sair da sala"
          aria-label="Sair da sala"
        >
          <svg
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};
