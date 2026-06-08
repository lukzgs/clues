/**
 * Component tests for ResultsView.
 *
 * Tests cover: rendering of votes (and absence of 'Nenhum voto'),
 * rendering of players, and Next Round actions.
 *
 * @vitest-environment jsdom
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResultsView } from '../../../src/components/game/ResultsView';
import { GameState, Player, GamePhase } from '../../../src/types';
import { renderWithProviders } from '../../helpers/render-with-providers';

const mockCard1 = {
  id: 1,
  imagePath: 'path1.jpg',
  imageUrl: 'path1.jpg',
  theme: 'theme1'
};

const mockCard2 = {
  id: 2,
  imagePath: 'path2.jpg',
  imageUrl: 'path2.jpg',
  theme: 'theme2'
};

const createMockGameState = (): GameState => ({
  phase: GamePhase.RESULTS,
  roomCode: 'TEST',
  players: [
    { id: 'p1', name: 'Narrator', isHost: true, isBot: false, score: 5, color: '#ff0000', isConnected: true, hand: [] },
    { id: 'p2', name: 'Player2', isHost: false, isBot: false, score: 3, color: '#00ff00', isConnected: true, hand: [] },
    { id: 'p3', name: 'Player3', isHost: false, isBot: false, score: 2, color: '#0000ff', isConnected: true, hand: [] }
  ],
  currentRound: 1,
  narratorIndex: 0,
  currentClue: 'A test clue',
  tableCards: [
    { playerId: 'p1', card: mockCard1, orderId: 0 },
    { playerId: 'p2', card: mockCard2, orderId: 1 }
  ],
  votes: {
    // p2 and p3 voted for p1's card (orderId: 0)
    'p2': 0,
    'p3': 0
  },
  winner: null,
  deckOption: 'original',
  deckCount: 50,
  playersWhoPlayed: [],
  playersWhoVoted: [],
  playersWhoReadied: [],
  phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
  victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 },
  phaseStartTime: Date.now(),
  afkKickVotes: [],
  timerEnabled: true,
});

describe('ResultsView', () => {
  it('does not display "Nenhum voto" for cards with zero votes', () => {
    const gameState = createMockGameState();
    renderWithProviders(<ResultsView gameState={gameState} playerId="p2" onNextRound={vi.fn()} onLeaveRoom={vi.fn()} />);

    // In previous versions, "Nenhum voto" would show for mockCard2 (which has 0 votes)
    // The test ensures this text is nowhere in the document
    expect(screen.queryByText(/Nenhum voto/i)).not.toBeInTheDocument();
  });

  it('renders voters for cards that received votes', () => {
    const gameState = createMockGameState();
    renderWithProviders(<ResultsView gameState={gameState} playerId="p1" onNextRound={vi.fn()} onLeaveRoom={vi.fn()} />);

    // p2 (Player2) and p3 (Player3) voted for the first card.
    // They are rendered as circles with their first initial 'P'.
    const voterInitials = screen.getAllByText('P');
    expect(voterInitials.length).toBeGreaterThanOrEqual(2);
    
    // Specifically verify titles
    expect(screen.getByTitle('Player2 votou aqui')).toBeInTheDocument();
    expect(screen.getByTitle('Player3 votou aqui')).toBeInTheDocument();
  });

  it('calls onNextRound when clicking the next round button', async () => {
    const gameState = createMockGameState();
    const onNextRound = vi.fn();
    renderWithProviders(<ResultsView gameState={gameState} playerId="p1" onNextRound={onNextRound} onLeaveRoom={vi.fn()} />);

    const nextBtn = screen.getByRole('button', { name: /Next Round/i });
    await userEvent.click(nextBtn);
    expect(onNextRound).toHaveBeenCalled();
  });
});
