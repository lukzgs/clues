import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../ui/Button';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ThemeToggle } from '../ui/ThemeToggle';

interface JoinScreenProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  /** When set, renders the simplified invite mode instead of the full screen */
  prefillRoomCode?: string;
  onCancelInvite?: () => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  prefillRoomCode,
  onCancelInvite,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isInviteMode = !!prefillRoomCode;

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError(t.join.errorNameRequired);
      return;
    }
    onCreateRoom(playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError(t.join.errorNameRequired);
      return;
    }
    const code = isInviteMode ? prefillRoomCode : roomCode;
    if (!code.trim() || code.length !== 6) {
      setError(t.join.errorRoomCode);
      return;
    }
    onJoinRoom(code.toUpperCase(), playerName.trim());
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
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  return (
    <div
      style={{ backgroundColor: theme.bgCanvas }}
      className="relative min-h-screen flex items-center justify-center p-3 md:p-4 transition-colors duration-500 text-white font-sans"
    >
      <div className="fixed top-4 right-4 z-[300] flex items-center gap-2">
        <ThemeToggle className="relative! top-auto! right-auto! z-auto!" />
        <LanguageToggle className="relative! top-auto! right-auto! z-auto!" />
      </div>

      {/* Ambient Lighting */}
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

      <div className="w-full max-w-[420px] z-10">
        <div
          className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-8 md:p-10 flex flex-col items-center transition-all duration-500 ${theme.cardBg}`}
          style={{
            animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Logo icon (Crown) */}
          <div
            className={`mb-5 md:mb-6 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border bg-black/50 ring-1 ring-white/10 transition-all duration-500 ${theme.accentBgLight} ${theme.accentBorder} ${theme.glowShadow}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${theme.accentText}`}
            >
              <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
              <line x1="2" y1="19" x2="22" y2="19" />
            </svg>
          </div>

          {isInviteMode ? (
            /* ========== INVITE MODE ========== */
            <>
              {/* Room code display */}
              <div
                className="text-center mb-6 md:mb-8 w-full"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
                }}
              >
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 md:mb-3 font-sans font-medium">
                  {t.join.joiningRoom}
                </p>
                <div
                  className={`rounded-xl px-5 md:px-6 py-3 md:py-4 inline-block border transition-all duration-300 ${theme.innerCardBg}`}
                >
                  <span
                    className={`text-2xl md:text-3xl font-cinzel font-bold tracking-wider ${theme.accentText}`}
                  >
                    {prefillRoomCode}
                  </span>
                </div>
              </div>

              {/* Name input */}
              <div
                className="w-full mb-6 md:mb-7 relative"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
                }}
              >
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 pl-1 font-sans font-medium">
                  {t.join.identity}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinRoom();
                  }}
                  placeholder={t.join.namePlaceholder}
                  className={`w-full rounded-xl px-4 py-3.5 outline-none ring-1 ring-white/5 transition-all font-cinzel text-lg ${theme.inputBg}`}
                  maxLength={20}
                  autoFocus
                />

                {/* Error floating below input */}
                <div
                  className={`absolute top-full left-0 w-full pt-1.5 flex items-center justify-center gap-1.5 text-red-500/90 text-[10px] uppercase tracking-[0.15em] font-sans font-medium transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                >
                  <span>{error}</span>
                </div>
              </div>

              {/* Join button */}
              <div
                className="w-full"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                }}
              >
                <Button
                  variant="primary"
                  size="md"
                  icon={arrowRightIcon}
                  iconPosition="right"
                  onClick={handleJoinRoom}
                  className="w-full py-3.5"
                >
                  {t.join.joinRoom}
                </Button>
              </div>

              {/* Back button */}
              {onCancelInvite && (
                <div
                  className="w-full mt-4 text-center"
                  style={{
                    animation:
                      'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
                  }}
                >
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={onCancelInvite}
                    className="w-full border-none"
                  >
                    {t.connecting.back}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* ========== NORMAL MODE ========== */
            <>
              {/* Title */}
              <div
                className="text-center mb-8 md:mb-10 w-full"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
                }}
              >
                <h1 className="text-4xl md:text-5xl tracking-tight text-white mb-3 font-cinzel font-bold">
                  {t.join.title}
                </h1>
                <p className="text-[10px] font-sans text-white/40 uppercase tracking-[0.2em]">
                  {t.join.subtitle}
                </p>
              </div>

              {/* Username field */}
              <div
                className="w-full mb-6 md:mb-7 relative"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
                }}
              >
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 pl-1 font-sans font-medium">
                  {t.join.identity}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateRoom();
                  }}
                  placeholder={t.join.namePlaceholder}
                  className={`w-full rounded-xl px-4 py-3.5 outline-none ring-1 ring-white/5 transition-all font-cinzel text-lg ${theme.inputBg}`}
                  maxLength={20}
                  autoFocus
                />

                {/* Error floating below input */}
                <div
                  className={`absolute top-full left-0 w-full pt-1.5 flex items-center justify-center gap-1.5 text-red-500/90 text-[10px] uppercase tracking-[0.15em] font-sans font-medium transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                >
                  <span>{error}</span>
                </div>
              </div>

              {/* Create Room button */}
              <div
                className="w-full mb-6 md:mb-8"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                }}
              >
                <Button
                  variant="primary"
                  size="md"
                  icon={
                    <span className="text-lg leading-none font-sans font-light">
                      +
                    </span>
                  }
                  iconPosition="left"
                  onClick={handleCreateRoom}
                  className="w-full py-3.5"
                >
                  {t.join.newRoom}
                </Button>
              </div>

              {/* Divider */}
              <div
                className="w-full flex items-center gap-4 mb-6 md:mb-8"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
                }}
              >
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] whitespace-nowrap font-sans font-medium">
                  {t.join.orJoinExisting}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Join existing */}
              <div
                className="w-full flex gap-3"
                style={{
                  animation:
                    'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
                }}
              >
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinRoom();
                  }}
                  placeholder={t.join.roomIdPlaceholder}
                  className={`flex-1 rounded-xl px-4 py-3.5 text-lg font-cinzel uppercase outline-none ring-1 ring-white/5 transition-all min-w-0 ${theme.inputBg}`}
                  maxLength={6}
                />
                <Button
                  variant="glass"
                  size="md"
                  icon={arrowRightIcon}
                  iconPosition="right"
                  onClick={handleJoinRoom}
                  className="shrink-0 px-6 py-3.5"
                >
                  {t.join.joinButton}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div
        className="fixed bottom-4 md:bottom-6 w-full text-center z-10 flex flex-col items-center gap-1.5"
        style={{
          animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
        }}
      >
        <p className="text-white/20 text-[10px] font-sans tracking-wide">
          {t.common.copyright}
        </p>
      </div>
    </div>
  );
};
