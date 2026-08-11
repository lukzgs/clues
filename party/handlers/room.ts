import type * as Party from 'partykit/server';
import GAME_CONFIG from '../../game.config.json';
import { PLAYER_COLORS } from '../../src/config';
import {
  type DeckOption,
  GamePhase,
  type PhaseTimeouts,
  type Player,
  ServerMessageType,
} from '../../src/types';
import { generatePlayerId, getPublicState } from '../game-logic';
import type GameServer from '../server';
import { sanitizeSettings } from '../settings-sanitizer';

function generateSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleJoinRoom(
  server: GameServer,
  playerName: string,
  conn: Party.Connection,
  reconnectId?: string,
  reconnectSecret?: string,
) {
  // Verifica se já está conectado
  if (server.connections.has(conn.id)) {
    server.sendError(conn, 'Você já está na sala');
    return;
  }

  // Reconnection: try to reclaim a player by ID (validated by secret)
  if (reconnectId) {
    const player = server.state.players.find(
      (p) => p.id === reconnectId && !p.isBot,
    );
    const storedSecret = server.playerSecrets.get(reconnectId);

    // Validate reconnect: player must exist, and if secret was stored, provided secret must match
    const isSecretValid = Boolean(
      player &&
        (!storedSecret ||
          (reconnectSecret && storedSecret === reconnectSecret)),
    );

    if (player && isSecretValid) {
      let secretToUse = storedSecret;
      if (!secretToUse) {
        secretToUse = generateSecret();
        server.playerSecrets.set(player.id, secretToUse);
      }

      // Verifica se já existe uma conexão ativa para este jogador
      let existingConn: Party.Connection | undefined;
      let existingConnIdSaved: string | undefined;
      for (const [
        existingConnId,
        existingPlayerId,
      ] of server.connections.entries()) {
        if (existingPlayerId === player.id) {
          existingConn = server.room.getConnection(existingConnId);
          existingConnIdSaved = existingConnId;
          break;
        }
      }

      if (existingConn) {
        // Assume que a nova conexão (mesmo jogador) é a correta e derruba a antiga imediatamente.
        if (existingConnIdSaved) server.connections.delete(existingConnIdSaved);
        existingConn.close(1000, 'Reconnected elsewhere');
        server.telemetry.recordGhostSocketKick(player.id, player.name);
      }

      // Reclaim: map new connection to existing player
      player.isConnected = true;

      server.connections.set(conn.id, player.id);

      // Remove from readied list so they can re-confirm if disconnected during RESULTS
      server.state.playersWhoReadied = server.state.playersWhoReadied.filter(
        (id) => id !== player.id,
      );

      server.broadcast({
        type: ServerMessageType.PLAYER_JOINED,
        player: { ...player, hand: [] },
      });

      server.broadcastState();

      // Send confirmation with player ID and secret so client can restore local state
      server.sendToConnection(conn, {
        type: ServerMessageType.SYNC_STATE,
        gameState: getPublicState(server.state, player.id),
        yourPlayerId: player.id,
        yourReconnectSecret: secretToUse,
      });

      server.telemetry.recordReconnectSuccess(player.name, reconnectId);
      return;
    }
    // reconnectId invalid or secret mismatch — recorded as failed reconnect
    server.telemetry.recordReconnectFailed(reconnectId);
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
    const playerSecret = generateSecret();
    server.playerSecrets.set(playerId, playerSecret);

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
  const playerSecret = generateSecret();
  server.playerSecrets.set(playerId, playerSecret);

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

export function handleLeaveRoom(
  server: GameServer,
  playerId: string,
  conn: Party.Connection,
) {
  const player = server.state.players.find((p) => p.id === playerId);
  if (!player) return;

  // Remove do jogo se no lobby
  if (server.state.phase === GamePhase.LOBBY) {
    server.state.players = server.state.players.filter(
      (p) => p.id !== playerId,
    );

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
  victoryCondition: {
    scoreEnabled: boolean;
    targetScore: number;
    narratorRoundsEnabled: boolean;
    narratorRounds: number;
  },
  deckOption: DeckOption,
  phaseTimeouts: PhaseTimeouts,
  timerEnabled: boolean,
) {
  if (server.state.phase !== GamePhase.LOBBY) return;

  const player = server.state.players.find((p) => p.id === playerId);
  if (!player?.isHost) return;

  server.state.timerEnabled = timerEnabled;

  // Apply sanitized settings from host
  const sanitized = sanitizeSettings(victoryCondition, phaseTimeouts);
  server.state.victoryCondition = sanitized.victoryCondition;
  server.state.phaseTimeouts = sanitized.phaseTimeouts;

  server.state.deckOption = deckOption;

  server.broadcastState();
}
