import { useState } from 'react';

interface JoinScreenProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onCreateRoom,
  onJoinRoom
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Choose your name first');
      return;
    }
    onCreateRoom(playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Choose your name first');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    onJoinRoom(roomCode.toUpperCase(), playerName.trim());
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Ambient Lighting */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
      />
      <div
        className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]"
      />

      <div className="w-full max-w-[420px] z-10">
        <div
          className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-[2rem] p-10 flex flex-col items-center"
          style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          {/* Logo icon (Crown) */}
          <div className="mb-6 flex items-center justify-center w-14 h-14 rounded-full border border-amber-500/30 bg-black/50 ring-1 ring-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-200">
              <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
              <line x1="2" y1="19" x2="22" y2="19" />
            </svg>
          </div>

          {/* Title */}
          <div className="text-center mb-10 w-full" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
            <h1 className="text-5xl font-sans font-light tracking-tight text-white mb-3">
              Clues
            </h1>
            <p className="text-[10px] font-sans text-white/40 uppercase tracking-[0.2em]">
              The art of storytelling
            </p>
          </div>

          {/* Username field */}
          <div className="w-full mb-6" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
            <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 pl-1 font-sans font-medium">
              Identity
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
              placeholder="Enter your name"
              className="w-full bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-[#1A1A1A]/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans font-light text-lg"
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs text-center mb-4 w-full bg-red-500/10 py-2 px-3 rounded-lg" style={{ animation: 'fade-in-up 0.3s ease-out both' }}>
              {error}
            </p>
          )}

          {/* Create Room button */}
          <div className="w-full mb-8" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}>
            <button
              onClick={handleCreateRoom}
              className="w-full font-cinzel font-bold uppercase tracking-widest bg-gradient-to-r from-amber-200 to-amber-400 text-black rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300"
            >
              <span className="text-lg leading-none mr-2 font-sans font-light">+</span>
              NEW ROOM
            </button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 mb-8" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] whitespace-nowrap font-sans font-medium">
              Or join existing
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Join existing */}
          <div className="w-full flex gap-3" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' }}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="ROOM ID"
              className="flex-1 bg-[#1A1A1A]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-mono tracking-[0.3em] uppercase placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-[#1A1A1A]/80 focus:ring-1 focus:ring-amber-500/30 transition-all min-w-0"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="shrink-0 bg-white/5 border border-white/10 text-white font-cinzel font-bold uppercase tracking-widest rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 hover:bg-white/10 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300"
            >
              JOIN
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 ml-1">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 w-full text-center z-0 pointer-events-none" style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both' }}>
        <p className="text-white/20 text-[10px] font-sans tracking-wide">
          &copy; 2026 Clues. Crafted for imagination.
        </p>
      </div>
    </div>
  );
};

