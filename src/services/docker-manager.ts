import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

const COMPOSE_FILE = 'C:\\Projetos\\google-maps-scraper-kit\\docker-compose.yml';
const DOCKER_EXE = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
const SCRAPER_BASE_URL = process.env.SCRAPER_BASE_URL || `http://localhost:${process.env.SCRAPER_PORT || '8080'}`;

export interface DockerBootResult {
  online: boolean;
  message: string;
  error?: string;
  startedNow: boolean;
}

/**
 * Checa rapidamente se o container já está respondendo na porta 8080
 */
export async function isScraperOnline(timeoutMs = 2000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SCRAPER_BASE_URL}/api/v1/jobs`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Dispara o Docker Desktop caso ainda não esteja rodando no Windows
 */
async function triggerDockerDesktopLaunch(): Promise<void> {
  if (fs.existsSync(DOCKER_EXE)) {
    try {
      await execAsync(`powershell -NoProfile -Command "Start-Process '${DOCKER_EXE}'"`);
    } catch (err) {
      console.warn('Não foi possível iniciar o Docker Desktop automaticamente:', err);
    }
  }
}

/**
 * Tenta executar 'docker compose up -d' no diretório do scraper
 */
async function runDockerComposeUp(): Promise<{ success: boolean; output: string }> {
  try {
    const cmd = `docker compose -f "${COMPOSE_FILE}" up -d`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    return { success: true, output: stdout || stderr };
  } catch (error: any) {
    return { success: false, output: error?.message || String(error) };
  }
}

/**
 * Orquestrador de Auto-Healing: garante que a engine na porta 8080 esteja rodando
 */
export async function ensureScraperRunning(
  onProgress?: (step: string) => void,
  maxWaitMs = 45000
): Promise<DockerBootResult> {
  // 1. Verifica se já está online
  const alreadyUp = await isScraperOnline(2000);
  if (alreadyUp) {
    onProgress?.('Motor Scraper já está ativo e operando na porta 8080.');
    return {
      online: true,
      message: 'Motor Scraper já ativo em http://localhost:8080',
      startedNow: false,
    };
  }

  onProgress?.('Motor Scraper offline na porta 8080. Iniciando container via Docker Compose...');

  // 2. Tenta docker compose up -d
  let composeRes = await runDockerComposeUp();

  // Se falhou e apontou para o daemon desligado, tenta ligar o Docker Desktop
  if (!composeRes.success && (composeRes.output.includes('dockerDesktopLinuxEngine') || composeRes.output.includes('daemon'))) {
    onProgress?.('Docker Desktop desligado. Solicitando inicialização do Docker Desktop no Windows...');
    await triggerDockerDesktopLaunch();
    // Espera 10 segundos para o daemon começar a subir e tenta docker compose novamente
    await new Promise((r) => setTimeout(r, 10000));
    composeRes = await runDockerComposeUp();
  }

  // 3. Polling aguardando a porta 8080 responder
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const isUp = await isScraperOnline(2000);
    if (isUp) {
      onProgress?.('Motor Scraper iniciado com sucesso e pronto para requisições!');
      return {
        online: true,
        message: 'Motor Scraper iniciado e pronto em http://localhost:8080',
        startedNow: true,
      };
    }
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    onProgress?.(`Aguardando inicialização da engine (${elapsed}s / ${Math.round(maxWaitMs / 1000)}s)...`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Se excedeu o tempo
  return {
    online: false,
    message: 'Tempo limite esgotado ao aguardar o motor Docker na porta 8080.',
    error: composeRes.output,
    startedNow: true,
  };
}
