import React, { useState } from 'react';
import { GAME_CONFIG } from '../../constants';

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
    if (!roomCode.trim() || roomCode.length < 4) {
      setError('Código da sala inválido');
      return;
    }
    onJoinRoom(roomCode.toUpperCase(), playerName.trim());
  };

  // Menu inicial
  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-5xl text-amber-400 text-center mb-2 cinzel">
            Clues
          </h1>
          <p className="text-slate-400 text-center mb-8 italic">
            Imaginação e dedução
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setMode('create')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-bold text-lg cinzel shadow-xl transition-colors"
            >
              Criar Sala
            </button>
            
            <button 
              onClick={() => setMode('join')}
              className="w-full bg-slate-800 hover:bg-slate-700 py-5 rounded-2xl font-bold border border-slate-700 text-lg cinzel transition-colors"
            >
              Entrar em Sala
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center leading-relaxed">
            Jogo inspirado em Dixit.<br/>
            {GAME_CONFIG.MIN_PLAYERS}-{GAME_CONFIG.MAX_PLAYERS} jogadores
          </div>
        </div>
      </div>
    );
  }

  // Criar sala
  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <button 
            onClick={() => { setMode('menu'); setError(''); }}
            className="text-slate-500 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          
          <h2 className="text-3xl text-amber-400 text-center mb-6 cinzel">
            Criar Sala
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                placeholder="Digite seu nome..."
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white outline-none transition-colors"
                maxLength={20}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button 
              onClick={handleCreateRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold cinzel text-lg transition-colors"
            >
              Criar e Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Entrar em sala
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <button 
          onClick={() => { setMode('menu'); setError(''); }}
          className="text-slate-500 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Voltar
        </button>
        
        <h2 className="text-3xl text-amber-400 text-center mb-6 cinzel">
          Entrar em Sala
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Seu Nome
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
              placeholder="Digite seu nome..."
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white outline-none transition-colors"
              maxLength={20}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Código da Sala
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="ABCD1"
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-xl text-white text-center text-2xl tracking-[0.3em] uppercase outline-none transition-colors font-mono"
              maxLength={6}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button 
            onClick={handleJoinRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold cinzel text-lg transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};
