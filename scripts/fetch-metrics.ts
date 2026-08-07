import type { TelemetrySnapshot } from '../party/telemetry';
import type { GlobalTelemetrySnapshot } from '../party/registry';

async function main() {
  const args = process.argv.slice(2);

  let targetRoom: string | null = null;
  let host = process.env.PARTYKIT_HOST || 'http://127.0.0.1:1999';
  let token = process.env.METRICS_SECRET_TOKEN || 'dev-secret-token';
  let rawJson = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--room' && args[i + 1]) {
      targetRoom = args[++i];
    } else if (arg === '--host' && args[i + 1]) {
      host = args[++i];
    } else if (arg === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (arg === '--prod') {
      host = 'https://clues-party.lukzgs.partykit.dev';
    } else if (arg === '--raw') {
      rawJson = true;
    } else if (!arg.startsWith('--')) {
      targetRoom = arg;
    }
  }

  const cleanHost = host.replace(/\/$/, '');

  // If a room code was specified, fetch specific room metrics
  if (targetRoom) {
    const roomUrl = `${cleanHost}/parties/main/${targetRoom}/metrics`;
    try {
      const res = await fetch(roomUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[ERRO] HTTP ${res.status}: ${res.statusText}`);
        console.error(`Detalhes: ${errorText}`);
        process.exit(1);
      }

      const data = (await res.json()) as TelemetrySnapshot;

      if (rawJson) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      console.log('\n================================================================================');
      console.log(`TELEMETRIA E LOGS DA SALA: ${data.roomCode}`);
      console.log('================================================================================');
      console.log(`Fase Atual: ${data.roomSummary.phase} | Uptime: ${data.uptimeSeconds}s`);
      console.log(`Conexoes Ativas: ${data.roomSummary.activeConnectionsCount}`);
      console.log(
        `Jogadores: ${data.roomSummary.totalPlayersCount} (Humanos: ${data.roomSummary.humanPlayersCount} | Bots: ${data.roomSummary.botPlayersCount} | Espectadores: ${data.roomSummary.spectatorsCount})`
      );

      console.log('\n--- METRICAS DE RECONEXAO ---');
      console.log(`[OK] Total Tentativas: ${data.counters.reconnectsTotal}`);
      console.log(`[OK] Reconexoes Bem-Sucedidas: ${data.counters.reconnectsSuccessful}`);
      console.log(`[FAIL] Falhas por reconnectId Invalido: ${data.counters.reconnectsFailedInvalidId}`);
      console.log(`[INFO] Sockets Fantasmas Substituidos: ${data.counters.ghostSocketKicks}`);

      console.log('\n--- ERROS E INFRAESTRUTURA ---');
      console.log(`[WARN] Violacoes de Rate Limit: ${data.counters.rateLimitViolations}`);
      console.log(`[WARN] Erros de Validacao Zod: ${data.counters.schemaValidationErrors}`);
      console.log(`[WARN] Excecoes Nao Tratadas: ${data.counters.uncaughtErrors}`);

      console.log('\n--- ULTIMOS LOGS DE EVENTOS ---');
      if (!data.recentLogs || data.recentLogs.length === 0) {
        console.log('Nenhum evento registrado no buffer ainda.');
      } else {
        data.recentLogs.forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          console.log(`[${time}] [${log.type}] ${log.message}`);
        });
      }
      console.log('================================================================================\n');
    } catch (err) {
      console.error(`[ERRO] Falha ao conectar ao servidor PartyKit em ${roomUrl}:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
    return;
  }

  // Default mode: fetch global metrics from RegistryServer
  const globalUrl = `${cleanHost}/parties/main/global/metrics`;
  try {
    const res = await fetch(globalUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[ERRO] HTTP ${res.status}: ${res.statusText}`);
      console.error(`Detalhes: ${errorText}`);
      process.exit(1);
    }

    const data = await res.json();
    const isGlobalPayload = (data as any).activeRoomsCount !== undefined;

    if (!isGlobalPayload) {
      // Fallback format as single room snapshot
      const roomData = data as any;
      console.log('\n================================================================================');
      console.log(`TELEMETRIA E LOGS DA SALA: ${roomData.roomCode || targetRoom || 'DESCONHECIDO'}`);
      console.log('================================================================================');
      console.log(`Fase Atual: ${roomData.roomSummary?.phase || 'DESCONHECIDA'} | Uptime: ${roomData.uptimeSeconds || 0}s`);
      console.log(`Conexoes Ativas: ${roomData.roomSummary?.activeConnectionsCount || 0}`);
      console.log(
        `Jogadores: ${roomData.roomSummary?.totalPlayersCount || 0} (Humanos: ${roomData.roomSummary?.humanPlayersCount || 0} | Bots: ${roomData.roomSummary?.botPlayersCount || 0} | Espectadores: ${roomData.roomSummary?.spectatorsCount || 0})`
      );

      console.log('\n--- METRICAS DE RECONEXAO ---');
      console.log(`[OK] Total Tentativas: ${roomData.counters?.reconnectsTotal || 0}`);
      console.log(`[OK] Reconexoes Bem-Sucedidas: ${roomData.counters?.reconnectsSuccessful || 0}`);
      console.log(`[FAIL] Falhas por reconnectId Invalido: ${roomData.counters?.reconnectsFailedInvalidId || 0}`);
      console.log(`[INFO] Sockets Fantasmas Substituidos: ${roomData.counters?.ghostSocketKicks || 0}`);

      console.log('\n--- ERROS E INFRAESTRUTURA ---');
      console.log(`[WARN] Violacoes de Rate Limit: ${roomData.counters?.rateLimitViolations || 0}`);
      console.log(`[WARN] Erros de Validacao Zod: ${roomData.counters?.schemaValidationErrors || 0}`);
      console.log(`[WARN] Excecoes Nao Tratadas: ${roomData.counters?.uncaughtErrors || 0}`);

      console.log('\n--- ULTIMOS LOGS DE EVENTOS ---');
      if (!roomData.recentLogs || roomData.recentLogs.length === 0) {
        console.log('Nenhum evento registrado no buffer ainda.');
      } else {
        roomData.recentLogs.forEach((log: any) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          console.log(`[${time}] [${log.type}] ${log.message}`);
        });
      }
      console.log('================================================================================\n');
      return;
    }

    const globalData = data as GlobalTelemetrySnapshot;
    const phaseDist = globalData.phaseDistribution || {};
    const phasesSummary = Object.entries(phaseDist)
      .map(([phase, count]) => `${phase}: ${count}`)
      .join(' | ') || 'Nenhuma sala ativa';

    console.log('\n================================================================================');
    console.log('TELEMETRIA GERAL DO SERVIDOR (GLOBAL DASHBOARD)');
    console.log('================================================================================');
    console.log(`Status Geral: ONLINE | Uptime do Registro: ${data.uptimeSeconds}s`);
    console.log(`Salas Ativas: ${data.activeRoomsCount} (${phasesSummary})`);

    console.log('\n--- USUARIOS SIMULTANEOS (GLOBAL CCU) ---');
    console.log(`Conexoes Ativas: ${data.globalCCU}`);
    console.log(`Total Jogadores Humanos: ${data.totalHumanPlayers} | Bots: ${data.totalBotPlayers} | Espectadores: ${data.totalSpectators}`);

    console.log('\n--- METRICAS TECNICAS ACUMULADAS ---');
    console.log(`[OK] Reconexoes com Sucesso: ${data.aggregatedCounters.reconnectsSuccessful}`);
    console.log(`[FAIL] Tentativas de Reconexao Com Falha: ${data.aggregatedCounters.reconnectsFailedInvalidId}`);
    console.log(`[INFO] Sockets Fantasmas Limpos: ${data.aggregatedCounters.ghostSocketKicks}`);
    console.log(`[WARN] Violacoes de Rate Limit: ${data.aggregatedCounters.rateLimitViolations}`);
    console.log(`[WARN] Erros de Validacao Zod: ${data.aggregatedCounters.schemaValidationErrors}`);
    console.log(`[WARN] Excecoes Nao Tratadas: ${data.aggregatedCounters.uncaughtErrors}`);

    console.log('\n--- TABELA DE SALAS ATIVAS ---');
    if (!data.rooms || data.rooms.length === 0) {
      console.log('Nenhuma sala registrada no momento.');
    } else {
      console.log(`SALAS ATIVAS (${data.rooms.length}):`);
      data.rooms.forEach(r => {
        console.log(
          `- ${r.roomCode.padEnd(14)} | Fase: ${r.phase.padEnd(18)} | Jogadores: ${r.totalPlayersCount} (${r.humanPlayersCount}h / ${r.botPlayersCount}b) | Uptime: ${r.uptimeSeconds}s`
        );
      });
    }
    console.log('================================================================================\n');
  } catch (err) {
    console.error(`[ERRO] Falha ao conectar ao Registro Global em ${globalUrl}:`, err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
