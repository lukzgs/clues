# Project Rules for AI Agents — Story Weaver / Clues

> These rules apply to all AI assistants and subagents working on the **Story Weaver / Clues** project.

---

## 1. Before Starting Any Work & Mandatory Workflow

1. **Always read `.agent/CONTEXT.md` first** before making any changes or exploring the codebase.
   - `CONTEXT.md` contains the project structure, documentation links, key files, and mandatory update policies.
2. **Language Policy**:
   - **Communication with User**: Portuguese (PT-BR).
   - **Code, Types, Comments, Documentation & Commit Messages**: English (EN) preferred for AI efficiency and code consistency.
   - **No Emojis or Icons**: Do not use emojis or decorative icons in assistant responses, reports, console logs, or commit messages. Keep messages clean, direct, and technical.
3. **Plan Before Executing**:
   - For any complex task (touching >3 files or architectural changes), provide a brief explanation of the problem, how it will be solved, and which files will be changed — then wait for user approval before proceeding.
   - Work incrementally so the user can observe progress and review changes as they are made.
4. **Documentation Policy**:
   - Documentation updates in `docs/en/` and `docs/pt-br/` MUST be done **ONLY when the user requests commits**.
   - When the user asks to commit: update affected documentation in both `docs/en/` and `docs/pt-br/` FIRST, then proceed with the commits.
5. **Commits & Destructive Commands Policy**:
   - **Never commit automatically** without explicit user request.
   - **Never execute destructive commands** (`git reset`, `git rebase`, deleting files/directories, dropping database state) without explicit user authorization.
   - Do not use `git add .`. Organize commits by features with appropriate tags (`chore:`, `fix:`, `feat:`, etc.).

---

## 2. Workspace & Operational Rules

### 2.1 Verification & Code Quality
- **Mandatory Post-Edit Verification**: Never declare a task completed without building/compiling the code and running linters or tests to verify system functionality.
- **Inspect Error Logs for Root Cause**: When facing a build or test error, read the full error log before proposing code changes. Base diagnoses strictly on empirical log evidence and root causes.
- **No Superficial Symptom Patches**: Never swallow exceptions with empty `try/catch` blocks, disable linter warnings via comments (`eslint-disable`), comment out failing tests, or return dummy fallback values to hide errors.

### 2.2 Scope Control & Code Preservation
- **Context First**: Read and understand relevant files before editing. Never guess file contents or structural logic.
- **Surgical Changes**: Restrict code edits strictly to the files and functions required for the task. Avoid opportunistic refactoring of unrelated code.
- **No Silent Functionality Removal**: Never remove existing features, routes, endpoints, components, or tests unless explicitly requested.
- **Preserve Existing Documentation & Comments**: Keep existing docstrings, types, and comments intact unless directly invalidated by the changes.

### 2.3 Architectural Integrity & Code Reuse
- **Audit Existing Code**: Search the repository for pre-existing utility functions, helpers, or components before creating new ones.
- **Maintain Contracts & Signatures**: If changing an exported function or type signature, find and update all invocation sites across the codebase.
- **Conservative Dependency Management**: Do not add external packages without checking if the solution can be implemented natively or with already installed dependencies.

### 2.4 Software Security
- **Boundary Input Validation**: Validate and sanitize all user input and external API payloads at entry boundaries.
- **Parameterized Queries & Path Validation**: Use parameterized database queries and validate absolute file paths to prevent SQL Injection and Path Traversal vulnerabilities.
- **No Hardcoded Secrets**: Never place API keys, passwords, or tokens in source code. Use environment variables via `.env` files.

### 2.5 Protection of Configuration Files
- **Authorization Required for Configs**: Never modify configuration files (`tsconfig.json`, `package.json`, `vite.config.ts`, `partykit.json`, `.env`, etc.) without explicit user permission.

---

## 3. Behavioral Guidelines (LLM Best Practices)

Derived from Andrej Karpathy's observations on LLM coding pitfalls.

### 3.1 Think Before Coding
- **Don't assume. Don't hide confusion. Surface tradeoffs.**
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 3.2 Simplicity First
- **Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If 200 lines could be 50, rewrite it. Ask: *"Would a senior engineer say this is overcomplicated?"*

### 3.3 Surgical Changes
- **Touch only what you must. Clean up only your own mess.**
- Match existing style. Don't refactor code that isn't broken.
- When changes create orphans (unused imports/variables), remove them. Do not delete pre-existing dead code unless asked.

### 3.4 Goal-Driven Execution
- **Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals (e.g., *"Write a test reproducing the bug, then make it pass"*).
- For multi-step tasks, state a brief plan with verification steps.

---

## 4. Subagents Architecture & Specialization Guide

The project utilizes specialized subagents to handle distinct architectural responsibilities as the codebase grows.

### 4.1 Subagents Guide Reference
- Full details and sizing criteria are defined in [.agent/agents/SUBAGENTS_GUIDE.md](file:///home/lukz_gs/projects/clues/.agent/agents/SUBAGENTS_GUIDE.md).
- Detailed prompt specifications for each role are located in [.agent/agents/subagents/](file:///home/lukz_gs/projects/clues/.agent/agents/subagents).

### 4.2 Active Configuration (Medium Project Size)
The **Story Weaver / Clues** project is currently classified as a **Medium Project** (50-300 files). The active 4-agent setup includes:

1. **Frontend Specialist** ([`frontend-specialist.md`](file:///home/lukz_gs/projects/clues/.agent/agents/subagents/frontend-specialist.md)):
   - Focus: React 19 UI components, state management, screen flows, styling, accessibility, and client-side validation.
2. **Backend Specialist** ([`backend-specialist.md`](file:///home/lukz_gs/projects/clues/.agent/agents/subagents/backend-specialist.md)):
   - Focus: PartyKit WebSocket server (`party/server.ts`), game state machine, scoring logic, bot logic, Zod validation schemas (`src/schemas/messages.ts`).
3. **Test Specialist** ([`test-specialist.md`](file:///home/lukz_gs/projects/clues/.agent/agents/subagents/test-specialist.md)):
   - Focus: Unit, integration, and E2E test suites. Covers happy path, edge cases, and error scenarios.
4. **Reviewer & Auditor** ([`reviewer.md`](file:///home/lukz_gs/projects/clues/.agent/agents/subagents/reviewer.md)):
   - Focus: Code review, security auditing, performance inspection, and adherence to `AGENTS.md`.

### 4.3 Sizing Scaling Matrix
- **Small (<50 files)**: `dev-principal` + `guardian`
- **Medium (50-300 files — *Active*)**: `frontend-specialist` + `backend-specialist` + `test-specialist` + `reviewer`
- **Large (300+ files)**: Adds `devops-specialist`, `security-specialist` (dedicated), and `migration-specialist` (on-demand).