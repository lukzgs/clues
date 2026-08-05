/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DesignSystemScreen } from '../../src/components/design-system/DesignSystemScreen';
import { LanguageProvider } from '../../src/i18n/index.tsx';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<LanguageProvider initialLang="pt">{ui}</LanguageProvider>);
};

describe('DesignSystemScreen Component', () => {
  it('renders header, navigation and main title correctly in PT', () => {
    renderWithProviders(<DesignSystemScreen />);

    expect(screen.getAllByText('STORY WEAVER')[0]).toBeInTheDocument();
    expect(screen.getByText('Amber Gold')).toBeInTheDocument();
    expect(screen.getByText('Design System & Guia de Estilo')).toBeInTheDocument();
  });

  it('allows switching between PT and EN using LanguageToggle in SysD header', () => {
    renderWithProviders(<DesignSystemScreen />);

    // Initially in Portuguese
    expect(screen.getByText('Retornar ao Jogo')).toBeInTheDocument();

    // Click LanguageToggle to switch to English
    const toggleBtn = screen.getByRole('button', { name: /switch to english|mudar para português/i });
    fireEvent.click(toggleBtn);

    // Should dynamically translate to English!
    expect(screen.getByText('Return to Game')).toBeInTheDocument();
    expect(screen.getByText('Design System & Style Guide')).toBeInTheDocument();
  });

  it('allows switching between the 5 live themes including Eclipse Violeta', () => {
    renderWithProviders(<DesignSystemScreen />);

    const glassThemeBtn = screen.getByText('Cristal Transparente');
    fireEvent.click(glassThemeBtn);
    expect(screen.getByText('Secondary Glass')).toBeInTheDocument();

    const violetThemeBtn = screen.getByText('Eclipse Violeta');
    fireEvent.click(violetThemeBtn);
    expect(screen.getByText('Cosmic Purple')).toBeInTheDocument();

    const redThemeBtn = screen.getByText('Carmim Profundo');
    fireEvent.click(redThemeBtn);
    expect(screen.getByText('Crimson Red')).toBeInTheDocument();
  });

  it('renders all 7 design system sections', () => {
    renderWithProviders(<DesignSystemScreen />);

    expect(screen.getAllByText(/Cores & Superfícies/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Tipografia & Hierarquia de Texto/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Botões & Ações/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Formulários & Inputs/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Exibição de Dados & Cards de Métricas/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Notificações, Alertas & Feedback Visual/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Páginas Integradas & Previews de Layout Real/i)[0]).toBeInTheDocument();
  });

  it('handles back to app action button click', () => {
    const handleBack = vi.fn();
    renderWithProviders(<DesignSystemScreen onBackToApp={handleBack} />);

    const backButton = screen.getByText('Retornar ao Jogo');
    fireEvent.click(backButton);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
