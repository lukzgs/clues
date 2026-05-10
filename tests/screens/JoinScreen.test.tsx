/**
 * Component tests for JoinScreen.
 *
 * Tests cover: rendering, form validation, user interactions,
 * create room flow, and join room flow.
 *
 * @vitest-environment jsdom
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinScreen } from '../../src/components/screens/JoinScreen';
import { renderWithProviders } from '../helpers/render-with-providers';

// ============================================
// HELPERS
// ============================================

function renderJoinScreen(overrides = {}) {
  const props = {
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    ...overrides,
  };

  const result = renderWithProviders(<JoinScreen {...props} />);
  return { ...result, ...props };
}

// ============================================
// RENDERING
// ============================================

describe('JoinScreen — rendering', () => {
  it('renders the title', () => {
    renderJoinScreen();
    expect(screen.getByText('Story Weaver')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderJoinScreen();
    expect(screen.getByText('The art of storytelling')).toBeInTheDocument();
  });

  it('renders the name input with placeholder', () => {
    renderJoinScreen();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('renders the NEW ROOM button', () => {
    renderJoinScreen();
    expect(screen.getByText('New Room')).toBeInTheDocument();
  });

  it('renders the room code input with placeholder', () => {
    renderJoinScreen();
    expect(screen.getByPlaceholderText('ROOM ID')).toBeInTheDocument();
  });

  it('renders the JOIN button', () => {
    renderJoinScreen();
    expect(screen.getByText('Join')).toBeInTheDocument();
  });

  it('does not show error message initially', () => {
    renderJoinScreen();
    expect(screen.queryByText('Choose your name first')).not.toBeInTheDocument();
    expect(screen.queryByText('Room code must be 6 characters')).not.toBeInTheDocument();
  });
});

// ============================================
// CREATE ROOM
// ============================================

describe('JoinScreen — create room', () => {
  it('calls onCreateRoom with trimmed name when valid', async () => {
    const user = userEvent.setup();
    const { onCreateRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), '  Alice  ');
    await user.click(screen.getByText('New Room'));

    expect(onCreateRoom).toHaveBeenCalledWith('Alice');
    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateRoom when pressing Enter on name input', async () => {
    const user = userEvent.setup();
    const { onCreateRoom } = renderJoinScreen();

    const input = screen.getByPlaceholderText('Enter your name');
    await user.type(input, 'Alice{Enter}');

    expect(onCreateRoom).toHaveBeenCalledWith('Alice');
    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('shows error when name is empty and trying to create room', async () => {
    const user = userEvent.setup();
    const { onCreateRoom } = renderJoinScreen();

    await user.click(screen.getByText('New Room'));

    expect(screen.getByText('Choose your name first')).toBeInTheDocument();
    expect(onCreateRoom).not.toHaveBeenCalled();
  });

  it('shows error when name is only whitespace', async () => {
    const user = userEvent.setup();
    const { onCreateRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), '   ');
    await user.click(screen.getByText('New Room'));

    expect(screen.getByText('Choose your name first')).toBeInTheDocument();
    expect(onCreateRoom).not.toHaveBeenCalled();
  });
});

// ============================================
// JOIN ROOM
// ============================================

describe('JoinScreen — join room', () => {
  it('calls onJoinRoom with uppercased code and trimmed name', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('ROOM ID'), 'abc123');
    await user.click(screen.getByText('Join'));

    expect(onJoinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it('calls onJoinRoom when pressing Enter on room code input', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob');
    const codeInput = screen.getByPlaceholderText('ROOM ID');
    await user.type(codeInput, 'abc123{Enter}');

    expect(onJoinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it('shows error when name is empty and trying to join', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('ROOM ID'), 'ABC123');
    await user.click(screen.getByText('Join'));

    expect(screen.getByText('Choose your name first')).toBeInTheDocument();
    expect(onJoinRoom).not.toHaveBeenCalled();
  });

  it('shows error when room code is empty', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob');
    await user.click(screen.getByText('Join'));

    expect(screen.getByText('Room code must be 6 characters')).toBeInTheDocument();
    expect(onJoinRoom).not.toHaveBeenCalled();
  });

  it('shows error when room code is less than 6 characters', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderJoinScreen();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('ROOM ID'), 'ABC');
    await user.click(screen.getByText('Join'));

    expect(screen.getByText('Room code must be 6 characters')).toBeInTheDocument();
    expect(onJoinRoom).not.toHaveBeenCalled();
  });

  it('room code input has maxLength of 6', () => {
    renderJoinScreen();
    const input = screen.getByPlaceholderText('ROOM ID');
    expect(input).toHaveAttribute('maxLength', '6');
  });
});

// ============================================
// ERROR CLEARING
// ============================================

describe('JoinScreen — error clearing', () => {
  it('clears error when user types in name input', async () => {
    const user = userEvent.setup();
    renderJoinScreen();

    // Trigger error
    await user.click(screen.getByText('New Room'));
    expect(screen.getByText('Choose your name first')).toBeInTheDocument();

    // Type in name — error should disappear
    await user.type(screen.getByPlaceholderText('Enter your name'), 'A');
    expect(screen.queryByText('Choose your name first')).not.toBeInTheDocument();
  });

  it('clears error when user types in room code input', async () => {
    const user = userEvent.setup();
    renderJoinScreen();

    // Trigger error: name present but code missing
    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob');
    await user.click(screen.getByText('Join'));
    expect(screen.getByText('Room code must be 6 characters')).toBeInTheDocument();

    // Type in room code — error should disappear
    await user.type(screen.getByPlaceholderText('ROOM ID'), 'A');
    expect(screen.queryByText('Room code must be 6 characters')).not.toBeInTheDocument();
  });
});

// ============================================
// INPUT CONSTRAINTS
// ============================================

describe('JoinScreen — input constraints', () => {
  it('name input has maxLength of 20', () => {
    renderJoinScreen();
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toHaveAttribute('maxLength', '20');
  });

  it('room code input converts to uppercase as user types', async () => {
    const user = userEvent.setup();
    renderJoinScreen();

    const input = screen.getByPlaceholderText('ROOM ID');
    await user.type(input, 'abcdef');
    expect(input).toHaveValue('ABCDEF');
  });

  it('name input is autofocused', () => {
    renderJoinScreen();
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toHaveFocus();
  });
});

// ============================================
// INVITE MODE
// ============================================

function renderInviteMode(overrides = {}) {
  return renderJoinScreen({ prefillRoomCode: 'ABC123', ...overrides });
}

describe('JoinScreen — invite mode rendering', () => {
  it('shows the room code', () => {
    renderInviteMode();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('shows "Joining Room" label', () => {
    renderInviteMode();
    expect(screen.getByText('Joining Room')).toBeInTheDocument();
  });

  it('shows the name input', () => {
    renderInviteMode();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('shows JOIN ROOM button', () => {
    renderInviteMode();
    expect(screen.getByText('JOIN ROOM')).toBeInTheDocument();
  });

  it('does NOT show NEW ROOM button', () => {
    renderInviteMode();
    expect(screen.queryByText('NEW ROOM')).not.toBeInTheDocument();
  });

  it('does NOT show Room ID input', () => {
    renderInviteMode();
    expect(screen.queryByPlaceholderText('ROOM ID')).not.toBeInTheDocument();
  });

  it('does NOT show the title "Story Weaver"', () => {
    renderInviteMode();
    expect(screen.queryByText('Story Weaver')).not.toBeInTheDocument();
  });

  it('does NOT show the divider "Or join existing"', () => {
    renderInviteMode();
    expect(screen.queryByText('Or join existing')).not.toBeInTheDocument();
  });
});

describe('JoinScreen — invite mode join flow', () => {
  it('calls onJoinRoom with prefilled code and trimmed name', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderInviteMode();

    await user.type(screen.getByPlaceholderText('Enter your name'), '  Alice  ');
    await user.click(screen.getByText('JOIN ROOM'));

    expect(onJoinRoom).toHaveBeenCalledWith('ABC123', 'Alice');
    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it('calls onJoinRoom when pressing Enter on name input', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderInviteMode();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Bob{Enter}');

    expect(onJoinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it('shows error when name is empty', async () => {
    const user = userEvent.setup();
    const { onJoinRoom } = renderInviteMode();

    await user.click(screen.getByText('JOIN ROOM'));

    expect(screen.getByText('Choose your name first')).toBeInTheDocument();
    expect(onJoinRoom).not.toHaveBeenCalled();
  });

  it('clears error when typing in name input', async () => {
    const user = userEvent.setup();
    renderInviteMode();

    await user.click(screen.getByText('JOIN ROOM'));
    expect(screen.getByText('Choose your name first')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'A');
    expect(screen.queryByText('Choose your name first')).not.toBeInTheDocument();
  });
});
