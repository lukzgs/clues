/**
 * Schemas de validação para mensagens cliente-servidor
 * Usando Zod para validação runtime
 */

import { z } from 'zod';

// ============================================
// VALIDADORES BASE
// ============================================

/**
 * String segura - sem caracteres HTML que poderiam causar XSS
 */
const SafeString = z.string().trim().regex(/^[^<>]*$/, 'Caracteres inválidos');

/**
 * ID numérico positivo
 */
const PositiveInt = z.number().int().positive();

// ============================================
// SCHEMAS DE MENSAGENS
// ============================================

export const JoinRoomSchema = z.object({
    type: z.literal('JOIN_ROOM'),
    playerName: SafeString.min(1, 'Nome obrigatório').max(20, 'Nome muito longo'),
    reconnectId: z.string().optional(),
});

export const LeaveRoomSchema = z.object({
    type: z.literal('LEAVE_ROOM'),
});

export const VictoryConditionSchema = z.object({
    scoreEnabled: z.boolean(),
    targetScore: z.number().int().min(10).max(100),
    narratorRoundsEnabled: z.boolean(),
    narratorRounds: z.number().int().min(1).max(5),
});

export const PhaseTimeoutsSchema = z.object({
    narrator: z.number().int().min(0).max(120),
    othersChoosing: z.number().int().min(0).max(120),
    voting: z.number().int().min(0).max(120),
    results: z.number().int().min(0).max(120),
});

export const StartGameSchema = z.object({
    type: z.literal('START_GAME'),
    victoryCondition: VictoryConditionSchema,
    deckOption: z.enum(['original', 'new', 'mixed']),
    phaseTimeouts: PhaseTimeoutsSchema,
});

export const UpdateSettingsSchema = z.object({
    type: z.literal('UPDATE_SETTINGS'),
    victoryCondition: VictoryConditionSchema,
    deckOption: z.enum(['original', 'new', 'mixed']),
    phaseTimeouts: PhaseTimeoutsSchema,
});

export const SubmitClueSchema = z.object({
    type: z.literal('SUBMIT_CLUE'),
    cardId: PositiveInt,
    clue: SafeString.min(1, 'Pista obrigatória').max(100, 'Pista muito longa'),
});

export const PlayCardSchema = z.object({
    type: z.literal('PLAY_CARD'),
    cardId: PositiveInt,
});

export const VoteSchema = z.object({
    type: z.literal('VOTE'),
    orderId: z.number().int().min(0),
});

export const NextRoundSchema = z.object({
    type: z.literal('NEXT_ROUND'),
});

export const RestartGameSchema = z.object({
    type: z.literal('RESTART_GAME'),
});

// [BOT] Schemas de bot
export const AddBotSchema = z.object({
    type: z.literal('ADD_BOT'),
});

export const RemoveBotSchema = z.object({
    type: z.literal('REMOVE_BOT'),
    botId: z.string().regex(/^bot-/, 'ID de bot inválido'),
});

export const VoteKickAfkSchema = z.object({
    type: z.literal('VOTE_KICK_AFK'),
});

// [SPECTATOR] Schemas de spectator/kick
export const KickPlayerSchema = z.object({
    type: z.literal('KICK_PLAYER'),
    targetPlayerId: z.string().min(1),
});

export const ToggleSpectatorSchema = z.object({
    type: z.literal('TOGGLE_SPECTATOR'),
    targetPlayerId: z.string().min(1),
});

export const RequestPlaySchema = z.object({
    type: z.literal('REQUEST_PLAY'),
});

// ============================================
// UNION DE TODAS AS MENSAGENS
// ============================================

export const ClientMessageSchema = z.discriminatedUnion('type', [
    JoinRoomSchema,
    LeaveRoomSchema,
    StartGameSchema,
    SubmitClueSchema,
    PlayCardSchema,
    VoteSchema,
    NextRoundSchema,
    RestartGameSchema,
    AddBotSchema,
    RemoveBotSchema,
    VoteKickAfkSchema,
    KickPlayerSchema,
    ToggleSpectatorSchema,
    RequestPlaySchema,
    UpdateSettingsSchema,
]);

// ============================================
// TIPOS INFERIDOS
// ============================================

export type ValidatedClientMessage = z.infer<typeof ClientMessageSchema>;
export type ValidatedJoinRoom = z.infer<typeof JoinRoomSchema>;
export type ValidatedSubmitClue = z.infer<typeof SubmitClueSchema>;
