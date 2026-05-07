/**
 * i18n Provider + useTranslation hook — Integration Tests
 *
 * Tests the LanguageProvider context, localStorage persistence,
 * auto-detection, and the LanguageToggle behavior.
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useTranslation } from '../../src/i18n/index.tsx';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';
import { translations } from '../../src/i18n/translations';

// ============================================
// HELPERS
// ============================================

const STORAGE_KEY = 'story-weaver:lang';

/** A test component that exposes the hook values */
function TestConsumer() {
  const { lang, t, setLang } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="title">{t.join.title}</span>
      <span data-testid="subtitle">{t.join.subtitle}</span>
      <span data-testid="newRoom">{t.join.newRoom}</span>
      <button data-testid="set-pt" onClick={() => setLang('pt')}>set-pt-btn</button>
      <button data-testid="set-en" onClick={() => setLang('en')}>set-en-btn</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <LanguageProvider>
      <TestConsumer />
    </LanguageProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  // Reset navigator.language to EN by default
  Object.defineProperty(navigator, 'language', {
    value: 'en-US',
    writable: true,
    configurable: true,
  });
});

// ============================================
// 1. PROVIDER BASICS
// ============================================

describe('LanguageProvider — basics', () => {
  it('provides EN translations by default for en-US browser', () => {
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('title').textContent).toBe('Story Weaver');
    expect(screen.getByTestId('subtitle').textContent).toBe('The art of storytelling');
  });

  it('provides PT translations by default for pt-BR browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('pt');
    expect(screen.getByTestId('subtitle').textContent).toBe('A arte de contar histórias');
  });

  it('provides PT translations for pt (without region)', () => {
    Object.defineProperty(navigator, 'language', { value: 'pt', configurable: true });
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('pt');
  });

  it('defaults to EN for non-Portuguese languages', () => {
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });
});

// ============================================
// 2. LOCALSTORAGE PERSISTENCE
// ============================================

describe('LanguageProvider — localStorage persistence', () => {
  it('respects stored "pt" preference over browser language', () => {
    localStorage.setItem(STORAGE_KEY, 'pt');
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('pt');
  });

  it('respects stored "en" preference over browser language', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    renderWithProvider();
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem(STORAGE_KEY, 'fr');
    renderWithProvider();
    // Should fall back to browser detection
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('saves language to localStorage when switching', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('set-pt'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('pt');

    await user.click(screen.getByTestId('set-en'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});

// ============================================
// 3. LANGUAGE SWITCHING
// ============================================

describe('LanguageProvider — language switching', () => {
  it('switches all translations from EN to PT', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    expect(screen.getByTestId('newRoom').textContent).toBe('New Room');

    await user.click(screen.getByTestId('set-pt'));

    expect(screen.getByTestId('lang').textContent).toBe('pt');
    expect(screen.getByTestId('newRoom').textContent).toBe('Nova Sala');
  });

  it('switches from PT to EN', async () => {
    localStorage.setItem(STORAGE_KEY, 'pt');
    const user = userEvent.setup();
    renderWithProvider();

    expect(screen.getByTestId('newRoom').textContent).toBe('Nova Sala');

    await user.click(screen.getByTestId('set-en'));

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('newRoom').textContent).toBe('New Room');
  });

  it('switching back and forth preserves correctness', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByTestId('set-pt'));
    expect(screen.getByTestId('subtitle').textContent).toBe('A arte de contar histórias');

    await user.click(screen.getByTestId('set-en'));
    expect(screen.getByTestId('subtitle').textContent).toBe('The art of storytelling');

    await user.click(screen.getByTestId('set-pt'));
    expect(screen.getByTestId('subtitle').textContent).toBe('A arte de contar histórias');
  });
});

// ============================================
// 4. useTranslation OUTSIDE PROVIDER — should throw
// ============================================

describe('useTranslation — outside provider', () => {
  it('should throw if used outside LanguageProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useTranslation must be used inside <LanguageProvider>');

    spy.mockRestore();
  });
});

// ============================================
// 5. LANGUAGE TOGGLE COMPONENT
// ============================================

describe('LanguageToggle component', () => {
  function renderToggle() {
    return render(
      <LanguageProvider>
        <LanguageToggle />
        <TestConsumer />
      </LanguageProvider>
    );
  }

  it('renders PT and EN pills', () => {
    renderToggle();
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('has correct aria-label for EN mode', () => {
    renderToggle();
    // When lang is EN, aria-label should suggest switching to PT
    const button = screen.getByRole('button', { name: /mudar para português/i });
    expect(button).toBeInTheDocument();
  });

  it('clicking PT pill switches to Portuguese', async () => {
    const user = userEvent.setup();
    renderToggle();

    expect(screen.getByTestId('lang').textContent).toBe('en');

    await user.click(screen.getByText('PT'));
    expect(screen.getByTestId('lang').textContent).toBe('pt');
  });

  it('clicking EN pill switches to English', async () => {
    localStorage.setItem(STORAGE_KEY, 'pt');
    const user = userEvent.setup();
    renderToggle();

    expect(screen.getByTestId('lang').textContent).toBe('pt');

    await user.click(screen.getByText('EN'));
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });
});

// ============================================
// 6. EXISTING TESTS REGRESSION — JoinScreen needs LanguageProvider
// ============================================

describe('JoinScreen — requires LanguageProvider to render', () => {
  it('should throw if rendered without LanguageProvider', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Dynamic import to avoid top-level issues
    const { JoinScreen } = await import('../../src/components/screens/JoinScreen');

    expect(() => {
      render(
        <JoinScreen
          onCreateRoom={vi.fn()}
          onJoinRoom={vi.fn()}
          prefillRoomCode=""
        />
      );
    }).toThrow();

    spy.mockRestore();
  });

  it('should render correctly WITH LanguageProvider', async () => {
    const { JoinScreen } = await import('../../src/components/screens/JoinScreen');

    render(
      <LanguageProvider>
        <JoinScreen
          onCreateRoom={vi.fn()}
          onJoinRoom={vi.fn()}
          prefillRoomCode=""
        />
      </LanguageProvider>
    );

    expect(screen.getByText('Story Weaver')).toBeInTheDocument();
  });
});
