import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const compose = ['compose', '-f', 'apps/api/docker-compose.yml'];

function docker(args, input = undefined) {
  return execFileSync('docker', [...compose, ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function psql(database, sql) {
  return execFileSync(
    'docker',
    [...compose, 'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', database, '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1'],
    { encoding: 'utf8', input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim();
}

console.log('--- Iniciando ensaio operacional de backup e restore coordenado ---');

const timestamp = Date.now();
const rehearsalDb = `codelife_restore_${timestamp}`;
const tempDir = resolve(tmpdir(), `codelife-backup-rehearsal-${timestamp}`);
const tempMediaBackup = join(tempDir, 'media_backup');
const tempMediaRestored = join(tempDir, 'media_restored');

mkdirSync(tempDir, { recursive: true });
mkdirSync(tempMediaBackup, { recursive: true });
mkdirSync(tempMediaRestored, { recursive: true });

try {
  // 1. Snapshot do banco de dados (pg_dump)
  console.log('[1/5] Gerando dump consistente do PostgreSQL...');
  const dumpSql = docker(['exec', '-T', 'postgres', 'pg_dump', '-U', 'postgres', '-d', 'codelife', '--clean', '--if-exists']);
  if (!dumpSql || dumpSql.length < 100) {
    throw new Error('pg_dump retornou saída vazia ou inválida');
  }

  // 2. Snapshot do filesystem de mídia
  console.log('[2/5] Realizando cópia de segurança dos assets de mídia controlada...');
  const sourceMediaDir = resolve('apps/api/assets');
  if (existsSync(sourceMediaDir)) {
    cpSync(sourceMediaDir, tempMediaBackup, { recursive: true });
  }

  // 3. Criando banco descartável e restaurando dados
  console.log(`[3/5] Restaurando dump no banco temporário isolado "${rehearsalDb}"...`);
  psql('postgres', `CREATE DATABASE "${rehearsalDb}";`);
  docker(['exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', rehearsalDb, '--set', 'ON_ERROR_STOP=1'], dumpSql);

  // 4. Restaurando arquivos de mídia na pasta de teste
  console.log('[4/5] Restaurando arquivos de mídia para volume efêmero...');
  cpSync(tempMediaBackup, tempMediaRestored, { recursive: true });

  // 5. Validação de integridade referencial banco + filesystem
  console.log('[5/5] Validando integridade coordenada banco + storage...');

  const originalIslandCount = psql('codelife', 'SELECT count(*) FROM "Island";');
  const restoredIslandCount = psql(rehearsalDb, 'SELECT count(*) FROM "Island";');
  if (originalIslandCount !== restoredIslandCount) {
    throw new Error(`Divergência de contagem de Islands: original=${originalIslandCount}, restaurado=${restoredIslandCount}`);
  }

  const originalLevelCount = psql('codelife', 'SELECT count(*) FROM "Level";');
  const restoredLevelCount = psql(rehearsalDb, 'SELECT count(*) FROM "Level";');
  if (originalLevelCount !== restoredLevelCount) {
    throw new Error(`Divergência de contagem de Levels: original=${originalLevelCount}, restaurado=${restoredLevelCount}`);
  }

  const originalMediaCount = psql('codelife', 'SELECT count(*) FROM "MediaAsset";');
  const restoredMediaCount = psql(rehearsalDb, 'SELECT count(*) FROM "MediaAsset";');
  if (originalMediaCount !== restoredMediaCount) {
    throw new Error(`Divergência de contagem de MediaAssets: original=${originalMediaCount}, restaurado=${restoredMediaCount}`);
  }

  // Verificar cada MediaAsset restaurado no filesystem
  const mediaKeysRaw = psql(rehearsalDb, 'SELECT "objectKey" FROM "MediaAsset";');
  if (mediaKeysRaw) {
    const keys = mediaKeysRaw.split('\n').map((k) => k.trim()).filter(Boolean);
    for (const key of keys) {
      const filePath = join(tempMediaRestored, key);
      if (!existsSync(filePath)) {
        throw new Error(`Arquivo de mídia correspondente ao banco não encontrado após restore: ${key}`);
      }
      const stats = statSync(filePath);
      if (stats.size === 0) {
        throw new Error(`Arquivo de mídia restaurado possui tamanho 0: ${key}`);
      }
    }
    console.log(`  ✔ Todos os ${keys.length} objetos de MediaAsset foram confirmados no filesystem restaurado.`);
  }

  console.log('--- Ensaio de backup/restore concluído com 100% de sucesso! ---');
} finally {
  // Limpeza
  console.log('Limpando recursos efêmeros de teste...');
  try {
    psql('postgres', `DROP DATABASE IF EXISTS "${rehearsalDb}";`);
  } catch (err) {
    console.warn(`Aviso ao dropar ${rehearsalDb}:`, err.message);
  }
  rmSync(tempDir, { recursive: true, force: true });
}
