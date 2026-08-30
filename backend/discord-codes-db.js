// ====================================
// WEBCH - BANCO DE CODIGOS DO DISCORD
// Codigos unicos por usuario, com expiracao e hash SHA-256.
// Armazena apenas o HASH do codigo (nunca o codigo puro no disco).
// Usa SQLite nativo do Node.js (node:sqlite) - sem dependencias externas.
// ====================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'discord-codes.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS codigos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_hash TEXT NOT NULL UNIQUE,
    userId      TEXT NOT NULL,
    username    TEXT NOT NULL,
    createdAt   TEXT NOT NULL,
    expiresAt   INTEGER NOT NULL,
    usado       INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_codigos_user   ON codigos(userId);
  CREATE INDEX IF NOT EXISTS idx_codigos_hash   ON codigos(codigo_hash);
  CREATE INDEX IF NOT EXISTS idx_codigos_expira ON codigos(expiresAt);
`);

// ====================================
// HELPERS
// ====================================

// Hash SHA-256 do codigo (o que vai para o banco)
function hashCode(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

// Alfabeto: letras maiusculas + numeros (sem ambiguidade O/0, I/1)
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Gera um codigo aleatorio de 8 caracteres
function gerarCodigoPuro() {
  const bytes = crypto.randomBytes(8);
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return codigo;
}

// ====================================
// OPERACOES
// ====================================

// Gera um codigo UNICO para o usuario (loop ate nao colidir no hash).
// Retorna o codigo PURO apenas aqui - so o HASH e salvo no banco.
// [controle] ttlMs: tempo de vida do codigo (padrao 15 minutos).
function gerarCodigo(userId, username, ttlMs = 15 * 60 * 1000) {
  const usr = String(userId || '');
  const nome = String(username || 'desconhecido');
  if (!usr) throw new Error('userId obrigatorio');

  let codigo = '';
  let tentativas = 0;
  for (;;) {
    codigo = gerarCodigoPuro();
    tentativas++;
    if (tentativas > 50) throw new Error('Falha ao gerar codigo unico');
    const existe = db.prepare('SELECT 1 FROM codigos WHERE codigo_hash = ?')
      .get(hashCode(codigo));
    if (!existe) break;
  }

  const agora = Date.now();
  const expiresAt = agora + ttlMs;
  db.prepare(
    `INSERT INTO codigos (codigo_hash, userId, username, createdAt, expiresAt, usado)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(hashCode(codigo), usr, nome, new Date(agora).toISOString(), expiresAt);

  console.log(`[DB] Codigo gerado para usuario ${usr} (expira em ${ttlMs / 1000}s)`);
  return { codigo, userId: usr, username: nome, expiresAt, ttlMs };
}

// Consulta um codigo por seu hash e devolve o estado atual (sem marcar como usado).
// Retorna:
//   { ok:true, estado:'valido', ...codigo }
//   { ok:false, motivo:'nao-encontrado' | 'expirado' | 'usado', ... }
function consultarCodigo(codigo) {
  const hash = hashCode(codigo);
  const registro = db.prepare(
    'SELECT * FROM codigos WHERE codigo_hash = ?'
  ).get(hash);

  if (!registro) return { ok: false, motivo: 'nao-encontrado' };

  if (registro.usado === 1) {
    return { ok: false, motivo: 'usado', registro };
  }
  if (Date.now() > registro.expiresAt) {
    return { ok: false, motivo: 'expirado', registro };
  }
  return {
    ok: true,
    estado: 'valido',
    id: registro.id,
    userId: registro.userId,
    username: registro.username,
    createdAt: registro.createdAt,
    expiresAt: registro.expiresAt
  };
}

// Consome um codigo (marca como usado). Retorna true se existia.
function marcarUsado(codigo) {
  const hash = hashCode(codigo);
  const result = db.prepare(
    'UPDATE codigos SET usado = 1 WHERE codigo_hash = ? AND usado = 0'
  ).run(hash);
  return result.changes > 0;
}

// Retorna os codigos de um usuario (para o comando /meus-codigos).
// Nunca expoe o codigo puro - apenas status, datas e hash truncado.
function listarCodigos(userId) {
  const rows = db.prepare(
    'SELECT * FROM codigos WHERE userId = ? ORDER BY id DESC'
  ).all(String(userId || ''));

  return rows.map(r => {
    let status = 'ativo';
    if (r.usado === 1) status = 'usado';
    else if (Date.now() > r.expiresAt) status = 'expirado';
    return {
      id: r.id,
      hashResumo: r.codigo_hash.slice(0, 8),
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      usado: r.usado === 1,
      status
    };
  });
}

// Remove codigos expirados (manutencao - pode ser agendada)
function limparExpirados() {
  const result = db.prepare('DELETE FROM codigos WHERE expiresAt < ?').run(Date.now());
  if (result.changes > 0) console.log(`[DB] ${result.changes} codigo(s) expirado(s) removidos`);
  return result.changes;
}

// Fecha o banco (usado apenas em encerramento controlado)
function fechar() {
  try { db.close(); } catch (e) { /* ja fechado */ }
}

module.exports = {
  gerarCodigo,
  consultarCodigo,
  marcarUsado,
  listarCodigos,
  limparExpirados,
  hashCode,
  fechar,
  dbPath
};