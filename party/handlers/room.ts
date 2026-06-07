import type * as Party from "partykit/server";
import { GamePhase, Player, DeckOption, PhaseTimeouts, ServerMessageType } from "../../src/types";
import { generatePlayerId, getPublicState } from "../game-logic";
import { PLAYER_COLORS } from "../../src/config";
import GAME_CONFIG from '../../game.config.json';
import type GameServer from "../server";

export async function handleJoinRoom(
  server: GameServer,
  playerName: string,
  conn: Party.Connection,
  reconnectId?: string
) {
  // Verifica se já está conectado
  if (server.connections.has(conn.id)) {
    server.sendError(conn, 'Você já está na sala');
    return;
  }

  // Reconnection: try to reclaim a player by ID (even if they still appear connected due to ghost socket)
  if (reconnectId) {
    const player = server.state.players.find(p => p.id === reconnectId && !p.isBot);
    if (player) {
      // Verifica se já existe uma conexão ativa para este jogador
      let existingConn: Party.Connection | undefined;
      let existingConnIdSaved: string | undefined;
      for (const [existingConnId, existingPlayerId] of server.connections.entries()) {
        if (existingPlayerId === player.id) {
          existingConn = server.room.getConnection(existingConnId);
          existingConnIdSaved = existingConnId;
          break;
        }
      }

      if (existingConn) {
        // Assume que a nova conexão (mesmo jogador) é a correta e derruba a antiga imediatamente.
        if (existingConnIdSaved) server.connections.delete(existingConnIdSaved);
        existingConn.close(1000, "Reconnected elsewhere");
      }

      // Reclaim: map new connection to existing player
      player.isConnected = true;
      
      server.connections.set(conn.id, player.id);

      // Remove from readied list so they can re-confirm if disconnected during RESULTS
      server.state.playersWhoReadied = server.state.playersWhoReadied.filter(id => id !== player.id);

      server.broadcast({
        type: ServerMessageType.PLAYER_JOINED,
        player: { ...player, hand: [] },
      });

      server.broadcastState();
      
      // Send confirmation with player ID so client can restore local state
      conn.send(JSON.stringify({
        type: ServerMessageType.SYNC_STATE,
        gameState: getPublicState(server.state, player.id),
        yourPlayerId: player.id
      }));
      
      return;
    }
    // reconnectId invalid — fall through to normal join
  }

  // Verifica fase — allow mid-game join as spectator
  if (server.state.phase !== GamePhase.LOBBY) {
    // Mid-game: check total connections limit
    if (server.state.players.length >= GAME_CONFIG.MAX_CONNECTIONS) {
      server.sendError(conn, 'Sala cheia');
      return;
    }

    // Create spectator player
    const playerId = generatePlayerId();
    const playerIndex = server.state.players.length;

    const newPlayer: Player = {
      id: playerId,
      name: playerName.trim() || `Jogador ${playerIndex + 1}`,
      score: 0,
      hand: [],
      color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
      isConnected: true,
      isHost: false,
      isSpectator: true, // Mid-game joins are always spectators
    };

    server.state.players.push(newPlayer);
    server.connections.set(conn.id, playerId);

    server.broadcast({
      type: ServerMessageType.PLAYER_JOINED,
      player: { ...newPlayer, hand: [] },
    });

    server.broadcastState();
    return;
  }

  // Verifica limite total de conexões
  if (server.state.players.length >= GAME_CONFIG.MAX_CONNECTIONS) {
    server.sendError(conn, 'Sala cheia');
    return;
  }

  // Cria jogador
  const playerId = generatePlayerId();
  const playerIndex = server.state.players.length;

  const newPlayer: Player = {
    id: playerId,
    name: playerName.trim() || `Jogador ${playerIndex + 1}`,
    score: 0,
    hand: [],
    color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
    isConnected: true,
    isHost: playerIndex === 0, // Primeiro jogador é host
  };

  server.state.players.push(newPlayer);
  server.connections.set(conn.id, playerId);

  // Notifica todos
  server.broadcast({
    type: ServerMessageType.PLAYER_JOINED,
    player: { ...newPlayer, hand: [] },
  });

  server.broadcastState();
}

export function handleLeaveRoom(server: GameServer, playerId: string, conn: Party.Connection) {
  const player = server.state.players.find(p => p.id === playerId);
  if (!player) return;

  // Remove do jogo se no lobby
  if (server.state.phase === GamePhase.LOBBY) {
    server.state.players = server.state.players.filter(p => p.id !== playerId);

    if (player.isHost && server.state.players.length > 0) {
      server.state.players[0].isHost = true;
    }
  } else {
    player.isConnected = false;
  }

  server.connections.delete(conn.id);

  server.broadcast({
    type: ServerMessageType.PLAYER_LEFT,
    playerId: player.id,
    playerName: player.name,
  });

  server.broadcastState();
}

export function handleUpdateSettings(
  server: GameServer,
  playerId: string,
  victoryCondition: { scoreEnabled: boolean; targetScore: number; narratorRoundsEnabled: boolean; narratorRounds: number },
  deckOption: DeckOption,
  phaseTimeouts: PhaseTimeouts
) {
  if (server.state.phase !== GamePhase.LOBBY) return;
  
  const player = server.state.players.find(p => p.id === playerId);
  if (!player?.isHost) return;

  // Apply victory condition from host
  server.state.victoryCondition = {
    scoreEnabled: victoryCondition.scoreEnabled,
    targetScore: Math.max(10, Math.min(100, victoryCondition.targetScore)),
    narratorRoundsEnabled: victoryCondition.narratorRoundsEnabled,
    narratorRounds: Math.max(1, Math.min(5, victoryCondition.narratorRounds)),
  };

  // Apply phase timeouts from host
  server.state.phaseTimeouts = {
    narrator: Math.max(0, Math.min(120, phaseTimeouts.narrator)),
    othersChoosing: Math.max(0, Math.min(120, phaseTimeouts.othersChoosing)),
    voting: Math.max(0, Math.min(120, phaseTimeouts.voting)),
    results: Math.max(0, Math.min(120, phaseTimeouts.results)),
  };

  server.state.deckOption = deckOption;

  server.broadcastState();
}
