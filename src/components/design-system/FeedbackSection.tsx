import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslation } from '../../i18n/index.tsx';

interface FeedbackSectionProps {
  onTriggerToast: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onTriggerToast }) => {
  const { theme } = useTheme();
  const { lang } = useTranslation();
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  const toggleDismiss = (id: string) => {
    setDismissedAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="feedback-alertas" className="scroll-mt-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-[0.2em] font-medium ${theme.accentText}`}>
            Seção 06
          </span>
          <h2 className="text-3xl font-cinzel text-white font-bold tracking-wide mt-1">
            Notificações, Alertas & Feedback Visual
          </h2>
          <p className="text-sm font-sans text-white/60 mt-1 max-w-2xl">
            Sinais visuais de estado da aplicação e disparadores de toasts flutuantes harmonizados com o tema <strong className={theme.accentText}>{theme.name[lang]}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INLINE ALERT BANNERS */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}>
            1. Banners de Alerta Estáticos (Inline Alerts)
          </h3>

          {/* Success Alert */}
          {!dismissedAlerts['success'] && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-start justify-between gap-3 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-emerald-300">
                    Sucesso — Partida Conectada
                  </h4>
                  <p className="text-xs font-sans text-emerald-200/80 mt-0.5">
                    Sua conexão com o servidor WebSocket da sala foi estabelecida com latência de 14ms.
                  </p>
                </div>
              </div>
              <button onClick={() => toggleDismiss('success')} className="text-emerald-400/60 hover:text-emerald-200 text-sm">
                ✕
              </button>
            </div>
          )}

          {/* Warning Alert */}
          {!dismissedAlerts['warning'] && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start justify-between gap-3 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-amber-300">
                    Aviso — Tempo Restante
                  </h4>
                  <p className="text-xs font-sans text-amber-200/80 mt-0.5">
                    Resta menos de 10 segundos para submeter sua jogada nesta fase.
                  </p>
                </div>
              </div>
              <button onClick={() => toggleDismiss('warning')} className="text-amber-400/60 hover:text-amber-200 text-sm">
                ✕
              </button>
            </div>
          )}

          {/* Error Alert */}
          {!dismissedAlerts['error'] && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start justify-between gap-3 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-red-300">
                    Erro — Falha de Validação
                  </h4>
                  <p className="text-xs font-sans text-red-200/80 mt-0.5">
                    Você não pode votar na sua própria carta jogada durante a fase de votação.
                  </p>
                </div>
              </div>
              <button onClick={() => toggleDismiss('error')} className="text-red-400/60 hover:text-red-200 text-sm">
                ✕
              </button>
            </div>
          )}

          {/* Info Alert */}
          {!dismissedAlerts['info'] && (
            <div className="bg-sky-950/40 border border-sky-500/40 rounded-xl p-4 flex items-start justify-between gap-3 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-sky-300">
                    Informação — Modo Espectador
                  </h4>
                  <p className="text-xs font-sans text-sky-200/80 mt-0.5">
                    Você está assistindo à partida em tempo real sem interferir na pontuação.
                  </p>
                </div>
              </div>
              <button onClick={() => toggleDismiss('info')} className="text-sky-400/60 hover:text-sky-200 text-sm">
                ✕
              </button>
            </div>
          )}

          {Object.keys(dismissedAlerts).length > 0 && (
            <button
              onClick={() => setDismissedAlerts({})}
              className={`text-[10px] font-sans uppercase tracking-widest ${theme.accentText} pt-2 block`}
            >
              Restaurar Alertas Dispensados
            </button>
          )}
        </div>

        {/* DYNAMIC TOAST TRIGGERS */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold border-b border-white/5 pb-2 ${theme.accentText}`}>
              2. Disparador de Notificações Flutuantes (Toasts)
            </h3>
            <p className="text-xs font-sans text-white/60 mt-2">
              Clique nos botões abaixo para disparar notificações dinâmicas que empilham no canto superior da tela com temporizador automático.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
            <button
              onClick={() => onTriggerToast('success', 'Ação concluída com sucesso!')}
              className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-cinzel font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-emerald-900/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              ✓ Disparar Toast Sucesso
            </button>

            <button
              onClick={() => onTriggerToast('warning', 'Atenção: O tempo da rodada está acabando.')}
              className="bg-amber-950/40 border border-amber-500/40 text-amber-300 font-cinzel font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-amber-900/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              ! Disparar Toast Alerta
            </button>

            <button
              onClick={() => onTriggerToast('error', 'Ops! Ocorreu um erro ao enviar sua jogada.')}
              className="bg-red-950/40 border border-red-500/40 text-red-300 font-cinzel font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-red-900/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              ✕ Disparar Toast Erro
            </button>

            <button
              onClick={() => onTriggerToast('info', 'Dica: Você pode reordenar suas cartas na mão.')}
              className="bg-sky-950/40 border border-sky-500/40 text-sky-300 font-cinzel font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-sky-900/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              ℹ Disparar Toast Informação
            </button>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-white/40">
            Toast System · Auto-dismiss em 4s · Posicionamento z-50
          </div>
        </div>
      </div>
    </section>
  );
};
