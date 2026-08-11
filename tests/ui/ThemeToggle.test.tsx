/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { LanguageProvider } from '../../src/i18n/index.tsx';
import { ThemeProvider } from '../../src/providers/ThemeProvider';

describe('ThemeToggle Component', () => {
  it('renders correctly and cycles through themes on click', () => {
    render(
      <LanguageProvider initialLang="pt">
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </LanguageProvider>,
    );

    const toggleBtn = screen.getByRole('button', {
      name: /alternar tema visual/i,
    });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute(
      'title',
      'Tema: Ouro Místico (Clique para alternar)',
    );

    // Click to cycle to Cristal Transparente
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute(
      'title',
      'Tema: Cristal Transparente (Clique para alternar)',
    );

    // Click to cycle to Eclipse Violeta
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute(
      'title',
      'Tema: Eclipse Violeta (Clique para alternar)',
    );
  });
});
