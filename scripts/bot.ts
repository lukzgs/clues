/**
 * BOT DE TESTE - CLUES
 * 
 * Script standalone para testar o jogo automaticamente.
 * Conecta como cliente WebSocket externo.
 * 
 * Para deletar: rm -rf scripts/
 * 
 * Uso: npx tsx scripts/bot.ts <roomCode> <botName> [botCount]
 * Exemplo: npx tsx scripts/bot.ts ABC12 Bot1
 *          npx tsx scripts/bot.ts ABC12 Bot 3   (cria Bot1, Bot2, Bot3)
 */

import WebSocket from 'ws';

// ============================================
// TIPOS (copiados para manter desacoplado)
// ============================================

enum GamePhase {
    LOBBY = 'LOBBY',
    NARRATOR_CHOOSING = 'NARRATOR_CHOOSING',
    OTHERS_CHOOSING = 'OTHERS_CHOOSING',
    VOTING = 'VOTING',
    RESULTS = 'RESULTS',
    GAME_OVER = 'GAME_OVER'
}

enum ClientMessageType {
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    START_GAME = 'START_GAME',
    SUBMIT_CLUE = 'SUBMIT_CLUE',
    PLAY_CARD = 'PLAY_CARD',
    VOTE = 'VOTE',
    NEXT_ROUND = 'NEXT_ROUND',
    RESTART_GAME = 'RESTART_GAME',
}

enum ServerMessageType {
    SYNC_STATE = 'SYNC_STATE',
    PLAYER_JOINED = 'PLAYER_JOINED',
    PLAYER_LEFT = 'PLAYER_LEFT',
    ERROR = 'ERROR',
}

interface Card {
    id: number;
    imageUrl: string;
}

interface Player {
    id: string;
    name: string;
    score: number;
    hand: Card[];
    color: string;
    isConnected: boolean;
    isHost: boolean;
}

interface TableCard {
    orderId: number;
    playerId: string;
    card: Card;
}

interface GameState {
    roomCode: string;
    phase: GamePhase;
    players: Player[];
    narratorIndex: number;
    currentClue: string;
    tableCards: TableCard[];
    votes: Record<string, number>;
    winner: string | null;
    deckCount: number;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

const PARTYKIT_HOST = process.env.PARTYKIT_HOST || 'localhost:1999';
const CLUES = [
    'Mistério', 'Sonho', 'Viagem', 'Memória', 'Esperança',
    'Reflexo', 'Silêncio', 'Aventura', 'Magia', 'Destino',
    'Aurora', 'Sombra', 'Liberdade', 'Infinito', 'Segredo'
];

// ============================================
// BOT CLASS
// ============================================

class CluesBot {
    private ws: WebSocket | null = null;
    private gameState: GameState | null = null;
    private playerId: string | null = null;
    private hasPlayed = false;
    private hasVoted = false;

    constructor(
        private roomCode: string,
        private botName: string
    ) { }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = `ws://${PARTYKIT_HOST}/party/${this.roomCode}`;
            console.log(`[${this.botName}] Conectando a ${url}...`);

            this.ws = new WebSocket(url);

            this.ws.on('open', () => {
                console.log(`[${this.botName}] Conectado! Entrando na sala...`);
                this.send({
                    type: ClientMessageType.JOIN_ROOM,
                    playerName: this.botName,
                });
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleMessage(msg);
                } catch (e) {
                    console.error(`[${this.botName}] Erro ao processar mensagem:`, e);
                }
            });

            this.ws.on('error', (err) => {
                console.error(`[${this.botName}] Erro:`, err.message);
                reject(err);
            });

            this.ws.on('close', () => {
                console.log(`[${this.botName}] Desconectado`);
            });
        });
    }

    private send(message: object) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    private handleMessage(msg: any) {
        switch (msg.type) {
            case ServerMessageType.SYNC_STATE:
                this.gameState = msg.gameState;
                if (msg.yourPlayerId) {
                    this.playerId = msg.yourPlayerId;
                }
                this.onStateUpdate();
                break;

            case ServerMessageType.PLAYER_JOINED:
                console.log(`[${this.botName}] Jogador entrou: ${msg.player.name}`);
                break;

            case ServerMessageType.PLAYER_LEFT:
                console.log(`[${this.botName}] Jogador saiu: ${msg.playerName}`);
                break;

            case ServerMessageType.ERROR:
                console.error(`[${this.botName}] Erro do servidor: ${msg.message}`);
                break;
        }
    }

    private onStateUpdate() {
        if (!this.gameState || !this.playerId) return;

        const me = this.gameState.players.find(p => p.id === this.playerId);
        if (!me) return;

        const narrator = this.gameState.players[this.gameState.narratorIndex];
        const isNarrator = narrator?.id === this.playerId;

        console.log(`[${this.botName}] Fase: ${this.gameState.phase} | Narrador: ${isNarrator ? 'SIM' : 'NÃO'}`);

        // Reset flags on new phases
        if (this.gameState.phase === GamePhase.NARRATOR_CHOOSING) {
            this.hasPlayed = false;
            this.hasVoted = false;
        }

        switch (this.gameState.phase) {
            case GamePhase.NARRATOR_CHOOSING:
                if (isNarrator) {
                    this.actAsNarrator(me);
                }
                break;

            case GamePhase.OTHERS_CHOOSING:
                if (!isNarrator && !this.hasPlayed) {
                    this.playCard(me);
                }
                break;

            case GamePhase.VOTING:
                if (!isNarrator && !this.hasVoted) {
                    this.vote(me);
                }
                break;

            case GamePhase.RESULTS:
                // Host avança automaticamente
                if (me.isHost) {
                    setTimeout(() => {
                        console.log(`[${this.botName}] Avançando para próxima rodada...`);
                        this.send({ type: ClientMessageType.NEXT_ROUND });
                    }, 2000);
                }
                break;

            case GamePhase.GAME_OVER:
                console.log(`[${this.botName}] Jogo terminou! Vencedor: ${this.gameState.winner}`);
                break;
        }
    }

    private actAsNarrator(me: Player) {
        if (me.hand.length === 0) return;

        // Escolhe carta aleatória
        const randomCard = me.hand[Math.floor(Math.random() * me.hand.length)];
        const randomClue = CLUES[Math.floor(Math.random() * CLUES.length)];

        console.log(`[${this.botName}] Escolhendo carta ${randomCard.id} com pista "${randomClue}"`);

        setTimeout(() => {
            this.send({
                type: ClientMessageType.SUBMIT_CLUE,
                cardId: randomCard.id,
                clue: randomClue,
            });
        }, 1000);
    }

    private playCard(me: Player) {
        if (me.hand.length === 0) return;

        // Verifica se já jogou
        const alreadyPlayed = this.gameState?.tableCards.some(tc => tc.playerId === this.playerId);
        if (alreadyPlayed) {
            this.hasPlayed = true;
            return;
        }

        // Escolhe carta aleatória
        const randomCard = me.hand[Math.floor(Math.random() * me.hand.length)];

        console.log(`[${this.botName}] Jogando carta ${randomCard.id}`);

        setTimeout(() => {
            this.send({
                type: ClientMessageType.PLAY_CARD,
                cardId: randomCard.id,
            });
            this.hasPlayed = true;
        }, 1500);
    }

    private vote(me: Player) {
        if (!this.gameState) return;

        // Verifica se já votou
        if (this.gameState.votes[this.playerId!] !== undefined) {
            this.hasVoted = true;
            return;
        }

        // Filtra cartas que não são minhas
        const validCards = this.gameState.tableCards.filter(tc => tc.playerId !== this.playerId);
        if (validCards.length === 0) return;

        // Escolhe voto aleatório
        const randomCard = validCards[Math.floor(Math.random() * validCards.length)];

        console.log(`[${this.botName}] Votando na carta ${randomCard.orderId}`);

        setTimeout(() => {
            this.send({
                type: ClientMessageType.VOTE,
                orderId: randomCard.orderId,
            });
            this.hasVoted = true;
        }, 1500);
    }

    disconnect() {
        this.ws?.close();
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
Uso: npx tsx scripts/bot.ts <roomCode> <botName> [count]

Exemplos:
  npx tsx scripts/bot.ts ABC12 TestBot      # 1 bot chamado TestBot
  npx tsx scripts/bot.ts ABC12 Bot 3        # 3 bots: Bot1, Bot2, Bot3
    `);
        process.exit(1);
    }

    const roomCode = args[0];
    const baseName = args[1];
    const count = parseInt(args[2] || '1', 10);

    console.log(`\n🤖 Iniciando ${count} bot(s) para sala ${roomCode}...\n`);

    const bots: CluesBot[] = [];

    for (let i = 0; i < count; i++) {
        const name = count > 1 ? `${baseName}${i + 1}` : baseName;
        const bot = new CluesBot(roomCode, name);

        try {
            await bot.connect();
            bots.push(bot);
            // Pequeno delay entre conexões
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            console.error(`Falha ao conectar ${name}:`, err);
        }
    }

    console.log(`\n✅ ${bots.length} bot(s) conectado(s). Pressione Ctrl+C para encerrar.\n`);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\nEncerrando bots...');
        bots.forEach(bot => bot.disconnect());
        process.exit(0);
    });
}

main().catch(console.error);
