/**
 * Helper de render para testes de componentes.
 *
 * Envolve o componente renderizado com os providers necessários
 * (LanguageProvider) para que hooks como useTranslation funcionem.
 *
 * O idioma é fixado em 'en' para garantir que os testes sejam
 * determinísticos independentemente do ambiente.
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { LanguageProvider } from '../../src/i18n';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <LanguageProvider initialLang="en">{children}</LanguageProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}
