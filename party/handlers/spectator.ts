import type * as Party from 'partykit/server';
import GAME_CONFIG from '../../game.config.json';
import { DeckOption, GamePhase, ServerMessageType } from '../../src/types';
import type GameServer from '../server';
import { checkPhaseProgression } from './afk';
import { handleNextRound } from './game';

export function handleKickPlayer(
  server: GameServer,
  hostId: string,
  targetId: string,
) {
  const host = server.state.players.find((p) => p.id === hostId);
  if (!host?.isHost) return;

  const target = server.state.players.find((p) => p.id === targetId);
  if (!target) return;

  // Cannot kick yourself
  if (hostId === targetId) return;

  // Save narrator ID for safety checks
  const currentNarratorId =
    server.state.players[server.state.narratorIndex]?.id;

  if (server.state.phase === GamePhase.LOBBY) {
    // Lobby phase: completely remove player from state
    server.state.players = server.state.players.filter(
      (p) => p.id !== targetId,
    );
    // Clean up their table cards and votes just in case
    delete server.state.votes[targetId];
    server.state.tableCards = server.state.tableCards.filter(
      (tc) => tc.playerId !== targetId,
    );
  } else {
    // Mid-game phase: soft-delete to preserve array indexes
    target.isConnected = false;
    target.isSpectator = true;
    // Remove their votes (they forfeit voting)
    delete server.state.votes[targetId];
    // Note: We DO NOT remove their tableCard if they already played it, so the round doesn't break
  }

  server.state.playersWhoReadied = server.state.playersWhoReadied.filter(
    (id) => id !== targetId,
  );
  server.state.afkKickVotes = server.state.afkKickVotes.filter(
    (id) => id !== targetId,
  );

  // If kicked player was host (shouldn't happen but safety), reassign
  if (target.isHost && server.state.players.length > 0) {
    target.isHost = false;
    const newHost =
      server.state.players.find((p) => !p.isSpectator && p.id !== targetId) ||
      server.state.players[0];
    if (newHost) newHost.isHost = true;
  }

  // Close the kicked player's connection
  for (const [connId, pId] of server.connections) {
    if (pId === targetId) {
      const conn = server.room.getConnection(connId);
      if (conn) {
        server.sendToConnection(conn, {
          type: ServerMessageType.PLAYER_KICKED,
          playerId: targetId,
          playerName: target.name,
        });
      }
      server.connections.delete(connId);
      break;
    }
  }

  // Broadcast to remaining players
  server.broadcast({
    type: ServerMessageType.PLAYER_KICKED,
    playerId: target.id,
    playerName: target.name,
  });

  // If during game, handle edge cases and phase progression
  if (server.state.phase !== GamePhase.LOBBY) {
    const remainingActive = server.state.players.filter((p) => !p.isSpectator);

    // If active players dropped below minimum, end the game
    if (remainingActive.length < GAME_CONFIG.MIN_PLAYERS) {
      server.changePhase(GamePhase.GAME_OVER);
      const winner = remainingActive.reduce(
        (prev, curr) => (prev.score > curr.score ? prev : curr),
        remainingActive[0],
      );
      server.state.winner = winner?.id ?? null;
      server.broadcastState();
      return;
    }

    // If the narrator was kicked during NARRATOR_CHOOSING, abort the round
    if (
      server.state.phase === GamePhase.NARRATOR_CHOOSING &&
      targetId === currentNarratorId
    ) {
      server.changePhase(GamePhase.RESULTS);
      const hostPlayer = server.state.players.find((p) => p.isHost);
      if (hostPlayer) handleNextRound(server, hostPlayer.id);
      return;
    }

    // Check if phase can now progress (fewer players needed)
    checkPhaseProgression(server);
  }

  server.broadcastState();
}

export function handleToggleSpectator(
  server: GameServer,
  requesterId: string,
  targetId: string,
) {
  // Only in lobby
  if (server.state.phase !== GamePhase.LOBBY) return;

  const requester = server.state.players.find((p) => p.id === requesterId);
  if (!requester) return;

  const target = server.state.players.find((p) => p.id === targetId);
  if (!target) return;

  // Permission check:
  // - Host can toggle anyone except themselves
  // - Any player can toggle themselves
  const isSelf = requesterId === targetId;
  const isHost = requester.isHost;

  if (!isSelf && !isHost) return; // Not allowed

  if (target.isSpectator) {
    // Spectator → Player: check max active players
    const activePlayers = server.state.players.filter((p) => !p.isSpectator);
    const maxPlayers = server.getMaxPlayersForDeck(
      server.state.deckOption,
      server.state.victoryCondition,
    );
    if (activePlayers.length >= maxPlayers) return;
    target.isSpectator = false;
  } else {
    // Player → Spectator
    target.isSpectator = true;
  }

  server.broadcastState();
}

export function handleRequestPlay(server: GameServer, playerId: string) {
  // Only in lobby
  if (server.state.phase !== GamePhase.LOBBY) return;

  const player = server.state.players.find((p) => p.id === playerId);
  if (!player) return;
  if (!player.isSpectator) return; // Already a player

  // Check max active players
  const activePlayers = server.state.players.filter((p) => !p.isSpectator);
  const maxPlayers = server.getMaxPlayersForDeck(
    server.state.deckOption,
    server.state.victoryCondition,
  );
  if (activePlayers.length >= maxPlayers) return;

  player.isSpectator = false;
  server.broadcastState();
}
