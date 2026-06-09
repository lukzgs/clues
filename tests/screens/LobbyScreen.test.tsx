/**
 * Component tests for LobbyScreen.
 *
 * Tests cover: rendering for host/guest, game options toggling,
 * bot management, starting game, and leaving room.
 *
 * @vitest-environment jsdom
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyScreen } from '../../src/components/screens/LobbyScreen';
import { GameState, Player, GamePhase } from '../../src/types';
import { GAME_CONFIG } from '../../src/constants';
import { renderWithProviders } from '../helpers/render-with-providers';

vi.mock('../../src/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/constants')>();
  return {
    ...actual,
    GAME_CONFIG: {
      ...actual.GAME_CONFIG,
      ENABLE_BOTS: true, // Default mock value
      MAX_PLAYERS_MIXED: 10,
      MAX_CONNECTIONS: 10,
    },
  };
});

// ============================================
// HELPERS
// ============================================

const createMockPlayer = (id: string, name: string, isHost: boolean = false, isBot: boolean = false): Player => ({
  id,
  name,
  isHost,
  isBot,
  color: '#ff0000',
  score: 0,
  isConnected: true,
  hand: [],
});

const createMockGameState = (players: Player[]): GameState => ({
  phase: GamePhase.LOBBY,
  roomCode: 'ABCD',
  players,
  currentRound: 0,
  narratorIndex: 0,
  currentClue: '',
  tableCards: [],
  votes: {},
  winner: null,
  deckOption: 'mixed',
  deckCount: 0,
  playersWhoPlayed: [],
  victoryCondition: {
    scoreEnabled: true,
    targetScore: 30,
    narratorRoundsEnabled: false,
    narratorRounds: 2,
  },
  phaseStartTime: Date.now(),
  afkKickVotes: [],
  playersWhoVoted: [],
  playersWhoReadied: [],
  phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
  timerEnabled: true,
});

function renderLobbyScreen(gameState: GameState, currentPlayer: Player, overrides = {}) {
  const props = {
    gameState,
    currentPlayer,
    onStartGame: vi.fn(),
    onLeaveRoom: vi.fn(),
    onAddBot: vi.fn(),
    onRemoveBot: vi.fn(),
    ...overrides,
  };

  return {
    ...renderWithProviders(<LobbyScreen {...props} />),
    props,
  };
}

describe('LobbyScreen', () => {
  let hostPlayer: Player;
  let guestPlayer: Player;
  let defaultGameState: GameState;

  beforeEach(() => {
    hostPlayer = createMockPlayer('p1', 'Alice', true);
    guestPlayer = createMockPlayer('p2', 'Bob', false);
    defaultGameState = createMockGameState([hostPlayer, guestPlayer]);
  });

  describe('Rendering', () => {
    it('shows the room code', () => {
      renderLobbyScreen(defaultGameState, hostPlayer);
      expect(screen.getByText('ABCD')).toBeInTheDocument();
    });

    it('lists all players', () => {
      renderLobbyScreen(defaultGameState, hostPlayer);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/PLAYERS \(2\/\d+\)/i)).toBeInTheDocument();
    });

    it('applies highlight styling for the current player card', () => {
      renderLobbyScreen(defaultGameState, guestPlayer);
      const bobName = screen.getByText('Bob');
      const card = bobName.closest('.rounded-xl');
      expect(card).toHaveClass('bg-amber-500/10');
    });
  });

  describe('Host Controls', () => {
    it('shows game options to host', () => {
      renderLobbyScreen(defaultGameState, hostPlayer);
      // Options toggles are rendered as buttons for host
      expect(screen.getByRole('button', { name: /Toggle score condition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Toggle rounds condition/i })).toBeInTheDocument();
    });

    it('shows add bot option if space available and bots enabled', () => {
      // @ts-ignore
      GAME_CONFIG.ENABLE_BOTS = true;
      renderLobbyScreen(defaultGameState, hostPlayer);
      expect(screen.getAllByRole('button', { name: /ADD BOT/i })[0]).toBeInTheDocument();
    });

    it('hides add bot when bots are disabled', () => {
      // @ts-ignore
      GAME_CONFIG.ENABLE_BOTS = false;
      renderLobbyScreen(defaultGameState, hostPlayer);
      expect(screen.queryAllByRole('button', { name: /ADD BOT/i }).length).toBe(0);
      // restore for other tests
      // @ts-ignore
      GAME_CONFIG.ENABLE_BOTS = true;
    });

    it('hides add bot when room is full', () => {
      const fullPlayers = Array.from({ length: 100 }).map((_, i) =>
        createMockPlayer(`p${i}`, `Player${i}`, i === 0)
      );
      const fullGameState = createMockGameState(fullPlayers);
      renderLobbyScreen(fullGameState, fullPlayers[0]);
      
      expect(screen.queryAllByRole('button', { name: /ADD BOT/i }).length).toBe(0);
    });

    it('calls onAddBot when add bot button clicked', async () => {
      const { props } = renderLobbyScreen(defaultGameState, hostPlayer);
      const addBotBtn = screen.getAllByRole('button', { name: /ADD BOT/i })[0];
      
      await userEvent.click(addBotBtn);
      expect(props.onAddBot).toHaveBeenCalled();
    });

    it('allows host to remove bots', async () => {
      const bot = createMockPlayer('b1', 'Bot', false, true);
      const stateWithBot = createMockGameState([hostPlayer, bot]);
      const { props } = renderLobbyScreen(stateWithBot, hostPlayer);
      
      const removeBtns = screen.getAllByRole('button', { name: /Remove bot/i });
      expect(removeBtns.length).toBeGreaterThan(0);
      
      await userEvent.click(removeBtns[0]);
      expect(props.onRemoveBot).toHaveBeenCalledWith('b1');
    });

    it('allows starting the game when min players are met', async () => {
      const minPlayers = Array.from({ length: GAME_CONFIG.MIN_PLAYERS }).map((_, i) =>
        createMockPlayer(`p${i}`, `Player${i}`, i === 0)
      );
      const gameState = createMockGameState(minPlayers);
      const { props } = renderLobbyScreen(gameState, minPlayers[0]);
      
      const startBtn = screen.getAllByRole('button', { name: /START GAME/i })[0];
      expect(startBtn).not.toBeDisabled();
      
      await userEvent.click(startBtn);
      expect(props.onStartGame).toHaveBeenCalled();
    });

    it('disables starting the game if below min players', () => {
      const gameState = createMockGameState([hostPlayer]); // only 1 player
      renderLobbyScreen(gameState, hostPlayer);
      
      const startBtn = screen.getAllByRole('button', { name: /Minimum \d+ players/i })[0];
      expect(startBtn).toBeDisabled();
    });
  });

  describe('Guest View', () => {
    it('does not show game option buttons to guest', () => {
      renderLobbyScreen(defaultGameState, guestPlayer);
      
      expect(screen.queryByRole('button', { name: /Toggle score condition/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Toggle rounds condition/i })).not.toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /ADD BOT/i }).length).toBe(0);
      
      expect(screen.getAllByText('Waiting for host to start...')[0]).toBeInTheDocument();
    });

    it('does not show bot removal buttons', () => {
      const bot = createMockPlayer('b1', 'Bot', false, true);
      const stateWithBot = createMockGameState([hostPlayer, guestPlayer, bot]);
      renderLobbyScreen(stateWithBot, guestPlayer);
      
      expect(screen.queryByRole('button', { name: /Remove bot/i })).not.toBeInTheDocument();
    });
  });
  
  describe('Actions', () => {
    it('calls onLeaveRoom when leave button clicked', async () => {
      const { props } = renderLobbyScreen(defaultGameState, guestPlayer);
      const leaveBtn = screen.getAllByRole('button', { name: /LEAVE/i })[0];
      await userEvent.click(leaveBtn);
      expect(props.onLeaveRoom).toHaveBeenCalled();
    });
  });
});
