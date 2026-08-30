// ====================================
// WEBCH - AUTENTICACAO DE USUARIOS
// Usuarios salvos em data/users.json
// ====================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, JSON.stringify({ usuarios: {} }, null, 2));

let db = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
if (!db.usuarios) db.usuarios = {};

function save() {
  fs.writeFileSync(usersPath, JSON.stringify(db, null, 2));
}

function hashPassword(senha, salt) {
  return crypto.pbkdf2Sync(senha, salt, 100000, 64, 'sha512').toString('hex');
}

function genSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function genCode() {
  return String(crypto.randomInt(100000, 999999));
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Codigos de verificacao em memoria (expira em 10 min)
const codigos = {};

function register({ nome, email, senha }) {
  const key = (email || '').trim().toLowerCase();
  if (!nome || !key || !senha) return { ok: false, message: 'Preencha nome, e-mail e senha' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) return { ok: false, message: 'E-mail invalido' };
  if (senha.length < 6) return { ok: false, message: 'A senha deve ter no minimo 6 caracteres' };
  if (db.usuarios[key]) return { ok: false, message: 'Esta conta ja existe. Faca login.' };

  const salt = genSalt();
  const usuario = {
    nome: nome.trim(),
    email: key,
    salt,
    senhaHash: hashPassword(senha, salt),
    criadoEm: new Date().toISOString(),
    verificado: false,
    premium: false,
    premiumAtivo: null
  };
  db.usuarios[key] = usuario;
  save();

  const code = genCode();
  codigos[key] = {
    code,
    expira: Date.now() + 10 * 60 * 1000
  };
  return { ok: true, code, email: key };
}

function verify(email, code) {
  const key = (email || '').trim().toLowerCase();
  const user = db.usuarios[key];
  if (!user) return { ok: false, message: 'Conta nao encontrada' };
  const entry = codigos[key];
  if (!entry) return { ok: false, message: 'Nenhum codigo pendente. Solicite novamente.' };
  if (Date.now() > entry.expira) {
    delete codigos[key];
    return { ok: false, message: 'Codigo expirado. Solicite um novo.' };
  }
  if (entry.code !== String(code).trim()) return { ok: false, message: 'Codigo incorreto' };

  user.verificado = true;
  delete codigos[key];
  save();

  const token = genToken();
  return { ok: true, token, user };
}

function resendCode(email) {
  const key = (email || '').trim().toLowerCase();
  const user = db.usuarios[key];
  if (!user) return { ok: false, message: 'Conta nao encontrada' };
  const code = genCode();
  codigos[key] = { code, expira: Date.now() + 10 * 60 * 1000 };
  return { ok: true, code, email: key };
}

function login(email, senha) {
  const key = (email || '').trim().toLowerCase();
  const user = db.usuarios[key];
  if (!user) return { ok: false, message: 'E-mail ou senha incorretos' };
  const hash = hashPassword(senha, user.salt);
  if (hash !== user.senhaHash) return { ok: false, message: 'E-mail ou senha incorretos' };
  if (!user.verificado) return { ok: false, message: 'Conta nao verificada. Confirme o codigo.' };
  const token = genToken();
  return { ok: true, token, user };
}

function getUserByToken(token) {
  if (!token) return null;
  const users = Object.values(db.usuarios);
  return users.find(u => u.token === token) || null;
}

function setToken(email, token) {
  const key = (email || '').trim().toLowerCase();
  const user = db.usuarios[key];
  if (!user) return;
  user.token = token;
  save();
}

function activatePremium(email, adminKey, configKey) {
  if (adminKey !== configKey) return { ok: false, message: 'Chave de ativacao invalida' };
  const key = (email || '').trim().toLowerCase();
  const user = db.usuarios[key];
  if (!user) return { ok: false, message: 'Conta nao encontrada' };
  user.premium = true;
  user.premiumAtivo = new Date().toISOString();
  save();
  return { ok: true, user };
}

function publicUser(user) {
  return {
    nome: user.nome,
    email: user.email,
    premium: user.premium,
    premiumAtivo: user.premiumAtivo,
    criadoEm: user.criadoEm
  };
}

module.exports = { register, verify, resendCode, login, getUserByToken, setToken, activatePremium, publicUser };