/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { ThemeProvider } from '../../src/providers/ThemeProvider';
import { LanguageProvider } from '../../src/i18n/index.tsx';

describe('ThemeToggle Component', () => {
  it('renders correctly and cycles through themes on click', () => {
    render(
      <LanguageProvider initialLang="pt">
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </LanguageProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /alternar tema visual/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('title', 'Tema: Ouro Místico (Clique para alternar)');

    // Click to cycle to Cristal Transparente
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('title', 'Tema: Cristal Transparente (Clique para alternar)');

    // Click to cycle to Eclipse Violeta
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('title', 'Tema: Eclipse Violeta (Clique para alternar)');
  });
});
