
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Player, 
  GameState, 
  GamePhase, 
  COLORS,
  Card
} from './types';
import { INITIAL_DECK, MAX_HAND_SIZE, WINNING_SCORE } from './constants';
import GameCard from './components/GameCard';
import { geminiService } from './services/gemini';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    narratorIndex: 0,
    currentClue: '',
    phase: GamePhase.LOBBY,
    deck: [...INITIAL_DECK].sort(() => Math.random() - 0.5),
    tableCards: [],
    votes: {},
    winner: null
  });

  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  const [clueInput, setClueInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPassingDevice, setIsPassingDevice] = useState(false);
  
  // Guard to prevent multiple AI processing on the same turn
  const processingAIs = useRef<Set<string>>(new Set());

  const narrator = useMemo(() => 
    gameState.players[gameState.narratorIndex], 
    [gameState.players, gameState.narratorIndex]
  );

  const currentPlayer = useMemo(() => 
    gameState.players.find(p => p.id === currentPlayerId), 
    [gameState.players, currentPlayerId]
  );

  // Initialize Game
  const startGame = (playerNames: string[], aiCount: number) => {
    let deck = [...gameState.deck];
    const initialPlayers: Player[] = [];

    playerNames.forEach((name, idx) => {
      const hand = deck.splice(0, MAX_HAND_SIZE);
      initialPlayers.push({
        id: `p-${idx}`,
        name,
        score: 0,
        hand,
        isAI: false,
        color: COLORS[idx % COLORS.length]
      });
    });

    for (let i = 0; i < aiCount; i++) {
      const hand = deck.splice(0, MAX_HAND_SIZE);
      initialPlayers.push({
        id: `ai-${i}`,
        name: `AI Spirit ${i + 1}`,
        score: 0,
        hand,
        isAI: true,
        color: COLORS[(playerNames.length + i) % COLORS.length]
      });
    }

    setGameState(prev => ({
      ...prev,
      players: initialPlayers,
      deck,
      phase: GamePhase.NARRATOR_CHOOSING,
      narratorIndex: 0,
      tableCards: [],
      votes: {}
    }));

    setCurrentPlayerId(initialPlayers[0].id);
  };

  // Switch to next player in hot-seat mode
  const moveToNextPlayer = () => {
    const currentIndex = gameState.players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % gameState.players.length;
    const nextPlayer = gameState.players[nextIndex];

    setCurrentPlayerId(nextPlayer.id);

    // If it's a human player and we are in a hidden-info phase, show pass device screen
    if (!nextPlayer.isAI && (gameState.phase === GamePhase.OTHERS_CHOOSING || gameState.phase === GamePhase.VOTING || gameState.phase === GamePhase.NARRATOR_CHOOSING)) {
      setIsPassingDevice(true);
    }
  };

  // Logic for AI Narrator
  useEffect(() => {
    if (gameState.phase === GamePhase.NARRATOR_CHOOSING && narrator?.isAI) {
      handleAINarrator();
    }
  }, [gameState.phase, gameState.narratorIndex]);

  const handleAINarrator = async () => {
    if (processingAIs.current.has(narrator.id)) return;
    processingAIs.current.add(narrator.id);
    setIsLoading(true);
    const result = await geminiService.getNarratorClue(narrator.hand);
    submitNarratorTurn(result.cardId, result.clue);
    setIsLoading(false);
    processingAIs.current.delete(narrator.id);
  };

  const submitNarratorTurn = (cardId: number, clue: string) => {
    setGameState(prev => {
      if (prev.tableCards.some(tc => tc.playerId === narrator.id)) return prev;

      const currentNarrator = prev.players[prev.narratorIndex];
      const card = currentNarrator.hand.find(c => c.id === cardId)!;
      const newHand = currentNarrator.hand.filter(c => c.id !== cardId);
      
      return {
        ...prev,
        currentClue: clue,
        tableCards: [{ playerId: currentNarrator.id, card }],
        players: prev.players.map(p => p.id === currentNarrator.id ? { ...p, hand: newHand } : p),
        phase: GamePhase.OTHERS_CHOOSING
      };
    });
    
    setClueInput('');
    setZoomedCard(null);
    moveToNextPlayer();
  };

  const handlePlayerCardChoice = (cardId: number) => {
    if (!currentPlayer) return;
    
    setGameState(prev => {
      if (prev.tableCards.some(tc => tc.playerId === currentPlayer.id)) return prev;

      const p = prev.players.find(pl => pl.id === currentPlayer.id);
      if (!p) return prev;
      
      const card = p.hand.find(c => c.id === cardId)!;
      const newHand = p.hand.filter(c => c.id !== cardId);
      const newTable = [...prev.tableCards, { playerId: p.id, card }];
      const allPlayed = newTable.length === prev.players.length;
      
      return {
        ...prev,
        tableCards: newTable,
        players: prev.players.map(pl => pl.id === p.id ? { ...pl, hand: newHand } : pl),
        phase: allPlayed ? GamePhase.VOTING : prev.phase
      };
    });

    setZoomedCard(null);
    moveToNextPlayer();
  };

  // AI Logic for picking a card matching the clue
  useEffect(() => {
    const runAIChoices = async () => {
      if (gameState.phase === GamePhase.OTHERS_CHOOSING) {
        const aiPlayersToAct = gameState.players.filter(p => 
          p.isAI && p.id !== narrator.id && !gameState.tableCards.some(tc => tc.playerId === p.id)
          && !processingAIs.current.has(p.id)
        );
        
        for (const ai of aiPlayersToAct) {
          processingAIs.current.add(ai.id);
          const chosenId = await geminiService.chooseCardForClue(ai.hand, gameState.currentClue);
          
          setGameState(prev => {
            if (prev.tableCards.some(tc => tc.playerId === ai.id)) return prev;
            const aiToUpdate = prev.players.find(p => p.id === ai.id);
            if (!aiToUpdate) return prev;
            
            const card = aiToUpdate.hand.find(c => c.id === chosenId) || aiToUpdate.hand[0];
            const newHand = aiToUpdate.hand.filter(c => c.id !== card.id);
            const newTable = [...prev.tableCards, { playerId: ai.id, card }];
            const allPlayed = newTable.length === prev.players.length;
            
            return {
              ...prev,
              tableCards: newTable,
              players: prev.players.map(p => p.id === ai.id ? { ...p, hand: newHand } : p),
              phase: allPlayed ? GamePhase.VOTING : prev.phase
            };
          });
          processingAIs.current.delete(ai.id);
        }
      }
    };
    runAIChoices();
  }, [gameState.phase, gameState.tableCards.length]);

  const handleVote = (targetPlayerId: string) => {
    setGameState(prev => {
      const newVotes = { ...prev.votes, [currentPlayerId]: targetPlayerId };
      const allVoted = Object.keys(newVotes).length === prev.players.length - 1;
      
      if (allVoted) return calculateScores({ ...prev, votes: newVotes });
      return { ...prev, votes: newVotes };
    });
    
    setZoomedCard(null);
    moveToNextPlayer();
  };

  // AI Logic for voting
  useEffect(() => {
    const runAIVotes = async () => {
      if (gameState.phase === GamePhase.VOTING) {
        const aiPlayersToVote = gameState.players.filter(p => 
          p.isAI && p.id !== narrator.id && !gameState.votes[p.id]
          && !processingAIs.current.has(p.id)
        );
        
        for (const ai of aiPlayersToVote) {
          processingAIs.current.add(ai.id);
          const voteTarget = await geminiService.voteForCard(gameState.currentClue, gameState.tableCards, ai.id);
          
          setGameState(prev => {
            const newVotes = { ...prev.votes, [ai.id]: voteTarget };
            const allVoted = Object.keys(newVotes).length === prev.players.length - 1;
            if (allVoted) return calculateScores({ ...prev, votes: newVotes });
            return { ...prev, votes: newVotes };
          });
          processingAIs.current.delete(ai.id);
        }
      }
    };
    runAIVotes();
  }, [gameState.phase, Object.keys(gameState.votes).length]);

  const calculateScores = (state: GameState): GameState => {
    const narratorId = state.players[state.narratorIndex].id;
    const votesForNarrator = Object.values(state.votes).filter(v => v === narratorId).length;
    const totalVoters = state.players.length - 1;

    let playerUpdates = [...state.players];

    if (votesForNarrator === 0 || votesForNarrator === totalVoters) {
      playerUpdates = playerUpdates.map(p => {
        if (p.id === narratorId) return p;
        return { ...p, score: p.score + 2 };
      });
    } else {
      playerUpdates = playerUpdates.map(p => {
        if (p.id === narratorId) return { ...p, score: p.score + 3 };
        if (state.votes[p.id] === narratorId) return { ...p, score: p.score + 3 };
        return p;
      });
    }

    playerUpdates = playerUpdates.map(p => {
      if (p.id === narratorId) return p;
      const votesReceived = Object.values(state.votes).filter(v => v === p.id).length;
      return { ...p, score: p.score + votesReceived };
    });

    const hasWinner = playerUpdates.find(p => p.score >= WINNING_SCORE);

    return {
      ...state,
      players: playerUpdates,
      phase: hasWinner ? GamePhase.GAME_OVER : GamePhase.RESULTS,
      winner: hasWinner?.name || null
    };
  };

  const nextRound = () => {
    setGameState(prev => {
      let newDeck = [...prev.deck];
      const newPlayers = prev.players.map(p => ({
        ...p,
        hand: [...p.hand, newDeck.splice(0, 1)[0]]
      }));
      const newNarratorIdx = (prev.narratorIndex + 1) % prev.players.length;
      return {
        ...prev,
        players: newPlayers,
        deck: newDeck,
        phase: GamePhase.NARRATOR_CHOOSING,
        narratorIndex: newNarratorIdx,
        currentClue: '',
        tableCards: [],
        votes: {}
      };
    });
    setZoomedCard(null);
    setClueInput('');
    setCurrentPlayerId(gameState.players[(gameState.narratorIndex + 1) % gameState.players.length].id);
  };

  const ZoomOverlay = () => {
    if (!zoomedCard) return null;

    const belongsToCurrentHand = currentPlayer?.hand.some(c => c.id === zoomedCard.id);
    const tableEntry = gameState.tableCards.find(tc => tc.card.id === zoomedCard.id);

    const navList: Card[] = useMemo(() => {
      if (belongsToCurrentHand) return currentPlayer?.hand || [];
      if (gameState.phase === GamePhase.VOTING || gameState.phase === GamePhase.RESULTS) {
        return gameState.tableCards.map(tc => tc.card);
      }
      return [zoomedCard];
    }, [belongsToCurrentHand, gameState.phase, gameState.tableCards, currentPlayer?.hand]);

    const currentIndex = navList.findIndex(c => c.id === zoomedCard.id);

    const navigate = (dir: number) => {
      const nextIdx = (currentIndex + dir + navList.length) % navList.length;
      setZoomedCard(navList[nextIdx]);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setZoomedCard(null)}>
        <div className="relative max-w-lg w-full bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-800 flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
          <button onClick={() => setZoomedCard(null)} className="absolute top-4 right-6 text-slate-500 hover:text-white text-3xl font-light">&times;</button>
          
          {navList.length > 1 && (
            <>
              <button onClick={() => navigate(-1)} className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg></button>
              <button onClick={() => navigate(1)} className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></button>
            </>
          )}

          <div className="w-full aspect-[2/3] max-h-[50vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
            <img src={zoomedCard.imageUrl} alt={zoomedCard.alt} className="w-full h-full object-cover" />
          </div>

          <div className="w-full space-y-4">
            {gameState.phase === GamePhase.NARRATOR_CHOOSING && belongsToCurrentHand && (
              <>
                <input autoFocus type="text" placeholder="Write a mysterious clue..." className="w-full bg-slate-800 border-2 border-indigo-600/50 p-4 rounded-xl text-white text-center text-xl italic outline-none focus:border-indigo-400" value={clueInput} onChange={e => setClueInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && clueInput.trim() && submitNarratorTurn(zoomedCard.id, clueInput)} />
                <button disabled={!clueInput.trim()} onClick={() => submitNarratorTurn(zoomedCard.id, clueInput)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold cinzel text-lg">Send Card & Clue</button>
              </>
            )}

            {gameState.phase === GamePhase.OTHERS_CHOOSING && belongsToCurrentHand && currentPlayerId !== narrator.id && (
              <button onClick={() => handlePlayerCardChoice(zoomedCard.id)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold cinzel text-lg">Play this Card</button>
            )}

            {gameState.phase === GamePhase.VOTING && tableEntry && tableEntry.playerId !== currentPlayerId && (
              <button onClick={() => handleVote(tableEntry.playerId)} className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl font-bold cinzel text-lg">Vote for this Vision</button>
            )}

            {gameState.phase === GamePhase.RESULTS && tableEntry && (
              <div className="text-center bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-slate-400 text-xs uppercase">Played by</p>
                <p className="text-xl font-bold" style={{ color: gameState.players.find(p => p.id === tableEntry.playerId)?.color }}>{gameState.players.find(p => p.id === tableEntry.playerId)?.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PassDeviceScreen = () => (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-4xl cinzel text-amber-500 mb-4 animate-float">Hand Over</h2>
      <p className="text-xl text-slate-400 mb-8 leading-relaxed">Please pass the device to<br/><span className="text-3xl font-black text-white" style={{ color: currentPlayer?.color }}>{currentPlayer?.name}</span></p>
      <button onClick={() => setIsPassingDevice(false)} className="bg-indigo-600 hover:bg-indigo-500 px-12 py-4 rounded-2xl font-bold cinzel text-xl shadow-2xl transition-transform active:scale-95">I am {currentPlayer?.name}</button>
    </div>
  );

  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-5xl text-amber-400 text-center mb-2 cinzel">Ethereal Clues</h1>
          <p className="text-slate-400 text-center mb-8 italic">Imagination meets deduction.</p>
          <div className="space-y-4">
             <button onClick={() => startGame(["Player 1", "Player 2"], 3)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-bold text-lg cinzel shadow-xl">Multiplayer (2P + 3AI)</button>
             <button onClick={() => startGame(["The Voyager"], 4)} className="w-full bg-slate-800 hover:bg-slate-700 py-5 rounded-2xl font-bold border border-slate-700 text-lg cinzel">Solo Mode (1P + 4AI)</button>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center leading-relaxed">Turn-based hot-seat multiplayer.<br/>Enlarge cards to take actions.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-48 bg-slate-950">
      {isPassingDevice && <PassDeviceScreen />}
      <ZoomOverlay />
      
      {/* HUD */}
      <div className="fixed top-0 left-0 w-full bg-slate-900/95 border-b border-slate-800 z-50 px-6 py-4 flex items-center justify-between shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg text-amber-500 cinzel hidden md:block">Ethereal Clues</h1>
          <div className="flex -space-x-3">
            {gameState.players.map(p => (
              <div key={p.id} className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-950 text-[10px] font-bold transition-all ${p.id === currentPlayerId ? 'scale-110 border-white ring-4 ring-white/20 z-10' : 'opacity-40'}`} style={{ backgroundColor: p.color }}>{p.score}</div>
            ))}
          </div>
        </div>
        <div className="text-center absolute left-1/2 -translate-x-1/2">
           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{gameState.phase.replace('_', ' ')}</div>
           <div className="text-sm font-bold text-white tracking-wide">{currentPlayer?.isAI ? 'Spirit thinking...' : `${currentPlayer?.name}'s turn`}</div>
        </div>
        <div className="text-right">
           <div className="text-sm text-amber-400 font-bold italic truncate max-w-[150px]">{gameState.currentClue ? `"${gameState.currentClue}"` : 'Awaiting word...'}</div>
        </div>
      </div>

      <main className="flex flex-col items-center justify-center pt-32 px-4 min-h-[70vh]">
        {isLoading && (
          <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center flex-col gap-6 backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="cinzel text-indigo-300 animate-pulse tracking-[0.2em]">Consulting the oracle...</p>
          </div>
        )}

        {/* Phase-specific Table Guidance */}
        {gameState.phase === GamePhase.NARRATOR_CHOOSING && !currentPlayer?.isAI && (
          <div className="bg-amber-900/10 border border-amber-500/20 p-8 rounded-[2.5rem] text-center max-w-lg mb-12 shadow-2xl animate-in fade-in zoom-in duration-500">
             <h2 className="text-3xl text-amber-400 cinzel mb-2">You are the Narrator</h2>
             <p className="text-amber-200/50">Pick a card from your hand below and describe its essence with a clue.</p>
          </div>
        )}

        {/* The Central Mesa */}
        <div className="w-full flex flex-wrap justify-center gap-6 py-6 animate-in slide-in-from-bottom-10 duration-700">
          {gameState.phase === GamePhase.OTHERS_CHOOSING && (
            <div className="w-full flex flex-col items-center gap-12">
               <div className="bg-indigo-950/20 border border-indigo-500/30 p-10 rounded-[3rem] text-center max-w-xl shadow-2xl">
                 <p className="text-indigo-400 text-xs uppercase font-black mb-2 tracking-widest">The Clue</p>
                 <h2 className="text-5xl font-black italic text-white drop-shadow-md">"{gameState.currentClue}"</h2>
               </div>
               <div className="flex flex-wrap justify-center gap-4">
                 {gameState.tableCards.map((tc, i) => (
                    <div key={i} className="animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
                       <GameCard card={tc.card} isRevealed={false} disabled size="md" className="shadow-2xl grayscale brightness-75" />
                       <p className="text-[10px] text-slate-600 text-center mt-3 uppercase font-black tracking-tighter">Accepted</p>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {(gameState.phase === GamePhase.VOTING || gameState.phase === GamePhase.RESULTS) && (
             <div className="w-full flex flex-col items-center gap-10">
               {gameState.phase === GamePhase.VOTING && (
                 <div className="text-center bg-slate-900/60 p-8 rounded-[3rem] border border-slate-800 max-w-xl">
                    <p className="text-slate-500 text-xs uppercase mb-2 tracking-widest">Identify the original vision</p>
                    <h2 className="text-4xl font-bold italic text-amber-500">"{gameState.currentClue}"</h2>
                 </div>
               )}
               <div className="flex flex-wrap justify-center gap-6 max-w-6xl">
                 {gameState.tableCards
                  .sort((a, b) => gameState.phase === GamePhase.VOTING ? a.card.id - b.card.id : 0)
                  .map(({ card, playerId }) => {
                    const isResults = gameState.phase === GamePhase.RESULTS;
                    const votes = Object.entries(gameState.votes).filter(([v, t]) => t === playerId);
                    const isNarrator = playerId === narrator.id;
                    const isMine = playerId === currentPlayerId;

                    return (
                      <div key={card.id} className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                         <GameCard 
                            card={card} 
                            size="md" 
                            onClick={() => (isResults || !isMine) && setZoomedCard(card)}
                            disabled={!isResults && isMine}
                            className={`transition-all shadow-xl ${!isResults && !isMine ? "hover:scale-110" : ""} ${isResults && isNarrator ? "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-105" : ""}`}
                         />
                         {isResults ? (
                           <div className="flex flex-col items-center gap-2">
                             <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white" style={{ backgroundColor: gameState.players.find(p => p.id === playerId)?.color }}>{gameState.players.find(p => p.id === playerId)?.name}</div>
                             <div className="flex gap-1 h-6 min-w-[30px]">
                               {votes.map(([v]) => <div key={v} className="w-6 h-6 rounded-full border border-slate-900 shadow flex items-center justify-center text-[10px] font-bold text-white animate-in zoom-in" style={{ backgroundColor: gameState.players.find(p => p.id === v)?.color }}>✓</div>)}
                             </div>
                           </div>
                         ) : (
                           isMine ? <span className="text-[10px] text-slate-700 uppercase font-black bg-slate-900 px-4 py-1.5 rounded-full">Your Choice</span> : <span className="text-[10px] text-indigo-500 uppercase font-black opacity-0 group-hover:opacity-100 transition-opacity">Expand to Vote</span>
                         )}
                      </div>
                    );
                  })}
               </div>
               {gameState.phase === GamePhase.RESULTS && (
                 <button onClick={nextRound} className="bg-indigo-600 hover:bg-indigo-500 px-24 py-6 rounded-3xl font-bold text-2xl cinzel shadow-2xl transition-transform active:scale-95 group">Next Round</button>
               )}
             </div>
          )}

          {gameState.phase === GamePhase.GAME_OVER && (
            <div className="text-center py-10 space-y-12 animate-in zoom-in duration-1000">
               <h2 className="text-8xl text-amber-500 cinzel tracking-widest drop-shadow-2xl">Ascension</h2>
               <p className="text-4xl text-white font-light"><span className="font-black text-indigo-500">{gameState.winner}</span> has deciphered the dreams.</p>
               <div className="max-w-xs mx-auto space-y-3 pt-6">
                 {gameState.players.sort((a,b) => b.score - a.score).map((p, i) => (
                   <div key={p.id} className="flex items-center justify-between bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
                      <span className="text-white font-bold">{i+1}. {p.name}</span>
                      <span className="text-amber-400 font-mono font-bold text-xl">{p.score}</span>
                   </div>
                 ))}
               </div>
               <button onClick={() => window.location.reload()} className="bg-white text-slate-950 px-16 py-5 rounded-2xl font-black cinzel text-xl hover:bg-amber-400 transition-colors">Start Anew</button>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER HAND - ACTIVE ONLY DURING CHOICE PHASES */}
      {gameState.phase !== GamePhase.GAME_OVER && gameState.phase !== GamePhase.RESULTS && (
        <div className="fixed bottom-0 left-0 w-full p-6 z-40 animate-in slide-in-from-bottom-20 duration-500">
           <div className="max-w-5xl mx-auto">
             <div className="flex justify-between items-end mb-4 px-8">
                <div className="bg-slate-900 px-6 py-2 rounded-t-3xl border-t border-x border-slate-800 flex items-center gap-3 shadow-2xl">
                   <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: currentPlayer?.color }} />
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{currentPlayer?.name}'s Hand</span>
                </div>
                <div className="text-[10px] text-slate-600 font-bold mb-1 tracking-widest">{gameState.deck.length} VOID CARDS</div>
             </div>
             <div className={`bg-slate-900/95 backdrop-blur-2xl border border-slate-800 p-8 rounded-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex justify-center gap-4 flex-wrap min-h-[160px] transition-all ${currentPlayer?.isAI ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                {currentPlayer?.hand.map(card => (
                  <div key={card.id} className="hover:-translate-y-10 transition-transform duration-300">
                    <GameCard card={card} size="sm" onClick={() => setZoomedCard(card)} className="shadow-2xl" />
                  </div>
                ))}
                {currentPlayer?.hand.length === 0 && <p className="text-slate-600 cinzel self-center opacity-50">Hand is empty...</p>}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
