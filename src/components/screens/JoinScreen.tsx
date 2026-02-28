import { useState } from 'react';

interface JoinScreenProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onCreateRoom,
  onJoinRoom
}) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome');
      return;
    }
    onCreateRoom(playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Código da sala deve ter 6 caracteres');
      return;
    }
    onJoinRoom(roomCode.toUpperCase(), playerName.trim());
  };

  // Menu inicial
  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full">
          {/* Card principal com glassmorphism sutil */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-8 md:p-10 shadow-2xl animate-fade-in">

            {/* Logo e título */}
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl text-amber-500 font-display mb-3">
                Clues
              </h1>
              <p className="text-slate-400 italic text-lg">
                It's like Dixit, but much better!
              </p>
            </div>

            {/* Botões de ação */}
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-bold font-display text-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                Criar Sala
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full bg-slate-800/80 hover:bg-slate-700 py-5 rounded-2xl font-bold font-display border border-slate-700 text-lg transition-all duration-200 active:scale-[0.98]"
              >
                Entrar em Sala
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Criar sala
  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-8 shadow-2xl animate-fade-in">

            {/* Voltar */}
            <button
              onClick={() => { setMode('menu'); setError(''); }}
              className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              Voltar
            </button>

            {/* Título */}
            <h2 className="text-3xl md:text-4xl text-amber-500 text-center mb-8 font-display">
              Criar Sala
            </h2>

            {/* Formulário */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                  placeholder="Digite seu nome..."
                  className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white outline-none transition-colors placeholder:text-slate-600"
                  maxLength={20}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg">
                  {error}
                </p>
              )}

              <button
                onClick={handleCreateRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold font-display text-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
              >
                Criar e Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Entrar em sala
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-8 shadow-2xl animate-fade-in">

          {/* Voltar */}
          <button
            onClick={() => { setMode('menu'); setError(''); }}
            className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            Voltar
          </button>

          {/* Título */}
          <h2 className="text-3xl md:text-4xl text-amber-500 text-center mb-8 font-display">
            Entrar em Sala
          </h2>

          {/* Formulário */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                Seu Nome
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                placeholder="Digite seu nome..."
                className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white outline-none transition-colors placeholder:text-slate-600"
                maxLength={20}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                Código da Sala
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="ABCD1"
                className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white text-center text-2xl tracking-[0.3em] uppercase outline-none transition-colors font-mono placeholder:text-slate-600 placeholder:text-lg placeholder:tracking-normal"
                maxLength={6}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleJoinRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold font-display text-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
