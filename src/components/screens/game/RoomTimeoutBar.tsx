import { useState, useEffect } from 'react';

export const RoomTimeoutBar: React.FC<{ closeTime: number }> = ({ closeTime }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((closeTime - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = Math.max(0, Math.floor((closeTime - Date.now()) / 1000));
      setTimeLeft(newTime);
      if (newTime === 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [closeTime]);

  if (timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-red-900/50 border-b border-red-500/30 text-red-200 text-center py-2.5 text-sm font-sans font-medium flex items-center justify-center gap-2 z-50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      A sala fechará por inatividade em {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};
