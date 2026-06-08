import { GamePhase, Player } from "../../src/types";
import { shuffle } from "../game-logic";
import type GameServer from "../server";

export function getAfkPlayers(server: GameServer): Player[] {
  const activePlayers = server.state.players.filter(p => !p.isSpectator);
  switch (server.state.phase) {
    case GamePhase.NARRATOR_CHOOSING:
      const narrator = server.state.players[server.state.narratorIndex];
      return narrator && !narrator.isSpectator ? [narrator] : [];
    case GamePhase.OTHERS_CHOOSING:
      return activePlayers.filter(p =>
        p.id !== server.state.players[server.state.narratorIndex]?.id &&
        !server.state.tableCards.some(tc => tc.playerId === p.id)
      );
    case GamePhase.VOTING:
      return activePlayers.filter(p =>
        p.id !== server.state.players[server.state.narratorIndex]?.id &&
        server.state.votes[p.id] === undefined
      );
    case GamePhase.RESULTS:
      return activePlayers.filter(p => !server.state.playersWhoReadied.includes(p.id));
    default:
      return [];
  }
}

export function handleVoteKickAfk(server: GameServer, playerId: string) {
  // Desabilitado completamente a pedido do usuário
  return;

  if (!server.state.afkKickVotes.includes(playerId)) {
    server.state.afkKickVotes.push(playerId);
  }

  const activeVoters = server.state.players.filter(p => !p.isSpectator && !p.isBot);
  const majority = Math.floor(activeVoters.length / 2) + 1;

  if (server.state.afkKickVotes.length >= majority) {
    const afkPlayers = getAfkPlayers(server);
    if (afkPlayers.length === 0) return;

    afkPlayers.forEach(p => {
      p.isSpectator = true;
      
      // If Host is kicked, reassign host
      if (p.isHost) {
        p.isHost = false;
        const newHost = server.state.players.find(np => !np.isSpectator);
        if (newHost) newHost.isHost = true;
      }
    });

    server.state.afkKickVotes = [];

    // Anti-soft-lock: se o narrador for kickado na sua vez, pula a rodada
    if (server.state.phase === GamePhase.NARRATOR_CHOOSING && afkPlayers.some(p => p.id === server.state.players[server.state.narratorIndex]?.id)) {
      server.changePhase(GamePhase.RESULTS);
      const hostId = server.state.players.find(p => p.isHost)?.id;
      if (hostId) server.handleNextRound(hostId as string);
      return;
    }

    checkPhaseProgression(server);
    server.broadcastState();
  }
}

export function checkPhaseProgression(server: GameServer) {
  const activePlayers = server.state.players.filter(p => !p.isSpectator);
  
  if (server.state.phase === GamePhase.OTHERS_CHOOSING) {
    if (server.state.tableCards.length >= activePlayers.length) {
      server.state.tableCards = shuffle(server.state.tableCards).map((tc, i) => ({
        ...tc,
        orderId: i,
      }));
      server.changePhase(GamePhase.VOTING);
      server.triggerBotActions();
    }
  } else if (server.state.phase === GamePhase.VOTING) {
    const votersCount = activePlayers.length - 1; // -1 for narrator
    const activeVotes = Object.keys(server.state.votes).filter(vId => !server.state.players.find(p => p.id === vId)?.isSpectator);
    if (activeVotes.length >= votersCount) {
      server.calculateScores();
    }
  }
}
