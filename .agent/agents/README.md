# Configuracao de Agentes — Story Weaver / Clues

Estrutura e diretrizes de configuracao de agentes de IA para o projeto **Story Weaver / Clues**.

## Estrutura

```
AGENTS.md                  # Regras gerais e diretrizes globais do workspace (na raiz)
.agent/agents/
  README.md                # Visao geral e documentacao da pasta de agentes
  SUBAGENTS_GUIDE.md       # Guia de subagentes e diagnostico de porte do projeto
  subagents/               # Definicoes individuais de cada subagente especialista
    dev-principal.md
    guardian.md
    frontend-specialist.md
    backend-specialist.md
    test-specialist.md
    reviewer.md
    devops-specialist.md
    security-specialist.md
    migration-specialist.md
```

## Como Usar no Projeto

1. As regras globais de conduta para todos os agentes estao centralizadas no arquivo `AGENTS.md` na raiz do projeto.
2. O arquivo `SUBAGENTS_GUIDE.md` contem o diagnostico atual do projeto (metricas de codigo, stack tecnica e pontos de complexidade), alem de determinar a configuracao de agentes ativa.
3. As definicoes e responsabilidades individuais de cada agente especializado ficam na pasta `subagents/`.
4. Dependendo do porte e momento do projeto, ativa-se o conjunto de agentes adequado:
   - **Pequeno** (< 50 arquivos): `dev-principal` + `guardian`
   - **Medio** (50-300 arquivos — *Status atual do projeto*): `frontend-specialist` + `backend-specialist` + `test-specialist` + `reviewer`
   - **Grande** (300+ arquivos): todos os 7 agentes principais (`frontend-specialist`, `backend-specialist`, `devops-specialist`, `test-specialist`, `security-specialist`, `reviewer`, `migration-specialist`)

## Manutencao e Evolucao

- Ao adicionar novos frameworks ou alterar a arquitetura, atualize a stack e as regras especificas em `AGENTS.md`.
- Conforme a base de codigo crescer, reavalie periodicamente as metricas em `SUBAGENTS_GUIDE.md` para ajustar os agentes ativos.
- Nos arquivos em `subagents/`, mantenha as descricoes e responsabilidades alinhadas as tecnologias reais utilizadas no projeto (React, PartyKit, Zod, Vite).
