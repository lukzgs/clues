import { GamePhase, Player } from "../../src/types";
import { shuffle } from "../game-logic";
import type GameServer from "../server";
import { calculateScores } from "./game";
import { triggerBotActions } from "./bot";

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

export function handleVoteKickAfk(_server: GameServer, _playerId: string) {
  // AFK kick voting disabled — see commit 08c57f0
  // Original implementation preserved in git history
  return;
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
      triggerBotActions(server);
    }
  } else if (server.state.phase === GamePhase.VOTING) {
    const votersCount = activePlayers.length - 1; // -1 for narrator
    const activeVotes = Object.keys(server.state.votes).filter(vId => !server.state.players.find(p => p.id === vId)?.isSpectator);
    if (activeVotes.length >= votersCount) {
      calculateScores(server);
    }
  }
}
