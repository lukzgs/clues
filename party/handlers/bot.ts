import { GamePhase, ServerMessageType } from "../../src/types";
import GAME_CONFIG from '../../game.config.json';
import type GameServer from "../server";
import { handleSubmitClue, handlePlayCard, handleVote } from "./game";

export function handleAddBot(server: GameServer, playerId: string) {
  if (!GAME_CONFIG.ENABLE_BOTS || !server.botManager) return;

  const player = server.state.players.find(p => p.id === playerId);
  if (!player?.isHost) return;
  if (server.state.phase !== GamePhase.LOBBY) return;

  const activePlayersCount = server.state.players.filter(p => !p.isSpectator).length;
  const maxActivePlayers = server.getMaxPlayersForDeck(server.state.deckOption, server.state.victoryCondition);
  
  if (server.state.players.length >= GAME_CONFIG.MAX_CONNECTIONS) return;
  if (activePlayersCount >= maxActivePlayers) return;

  const usedColors = server.state.players.map(p => p.color);
  const bot = server.botManager.addBot(server.state.players, usedColors);

  if (bot) {
    server.state.players.push(bot);
    server.broadcast({
      type: ServerMessageType.PLAYER_JOINED,
      player: { ...bot, hand: [] },
    });
    server.broadcastState();
  }
}

export function handleRemoveBot(server: GameServer, playerId: string, botId: string) {
  if (!GAME_CONFIG.ENABLE_BOTS || !server.botManager) return;

  const player = server.state.players.find(p => p.id === playerId);
  if (!player?.isHost) return;
  if (server.state.phase !== GamePhase.LOBBY) return;

  const bot = server.state.players.find(p => p.id === botId && p.isBot);
  if (!bot) return;

  server.state.players = server.botManager.removeBot(server.state.players, botId);

  server.broadcast({
    type: ServerMessageType.PLAYER_LEFT,
    playerId: bot.id,
    playerName: bot.name,
  });
  server.broadcastState();
}

export function triggerBotActions(server: GameServer) {
  if (!GAME_CONFIG.ENABLE_BOTS || !server.botManager) return;

  server.botManager.executeBotActions(server.state, {
    submitClue: (botId: string, cardId: number, clue: string) => handleSubmitClue(server, botId, cardId, clue),
    playCard: (botId: string, cardId: number) => handlePlayCard(server, botId, cardId),
    vote: (botId: string, orderId: number) => handleVote(server, botId, orderId),
  });
}
