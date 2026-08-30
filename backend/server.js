const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const auth = require('./auth');
const mailer = require('./mailer');
const pix = require('./pix');
const discordCodes = require('./discord-codes-db');
const { rateLimit } = require('./middlewares/rateLimit');
const { assinarJwt } = require('./middlewares/jwt');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Config
const cfg = {
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  adminKey: process.env.ADMIN_KEY,
  jwtSecret: process.env.JWT_SECRET || 'webch_jwt_secret_padrao',
  publicUrl: process.env.PUBLIC_URL || 'http://192.168.1.107:8080',
  pixKey: process.env.PIX_KEY,
  pixName: process.env.PIX_NOME,
  pixCity: process.env.PIX_CIDADE,
  pixAmount: process.env.PIX_AMOUNT ? parseFloat(process.env.PIX_AMOUNT) : null,
  pixTxid: process.env.PIX_TXID
};

mailer.init(cfg);

// Carregar offsets do CS2
const offsetsPath = path.join(__dirname, '..', 'offsets', 'cs2.json');
let offsetsData = {};

try {
  const rawData = fs.readFileSync(offsetsPath, 'utf8');
  offsetsData = JSON.parse(rawData);
  console.log('Offsets do CS2 carregadas com sucesso!');
} catch (error) {
  console.error('Erro ao carregar offsets:', error.message);
}

// Carregar offsets de todos os jogos
const gamesPath = path.join(__dirname, '..', 'offsets');
const games = {};

function loadGame(file, key) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(gamesPath, file), 'utf8'));
    games[key] = raw;
    return true;
  } catch (error) {
    console.error(`Erro ao carregar offsets de ${key}:`, error.message);
    return false;
  }
}

loadGame('cs2.json', 'CS2');
loadGame('fortnite.json', 'FORTNITE');
loadGame('roblox.json', 'ROBLOX');

// Dados premium
const premiumDataPath = path.join(__dirname, 'premium-data.json');
let premiumData = { planos: [], appsPremium: [], offsetsPremium: [], atualizadoEm: null };
try {
  premiumData = JSON.parse(fs.readFileSync(premiumDataPath, 'utf8'));
} catch (error) {
  console.error('Erro ao carregar premium-data.json:', error.message);
}

// Extrai pares nome/valor de um objeto de offsets (inclusive Roblox aninhado)
function flattenOffsets(obj, prefix) {
  const out = [];
  for (const [nome, valor] of Object.entries(obj)) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      flattenOffsets(valor, prefix + nome + '.').forEach(e => out.push(e));
    } else if (typeof valor === 'number' && valor > 0) {
      out.push({ nome: prefix + nome, valor: '0x' + valor.toString(16).toUpperCase() });
    } else if (typeof valor === 'string') {
      out.push({ nome: prefix + nome, valor });
    }
  }
  return out;
}

function allEntries() {
  const result = {};
  for (const [game, data] of Object.entries(games)) {
    const fonte = data.offsets || data.Offsets || {};
    result[game] = flattenOffsets(fonte, '');
  }
  return result;
}

// Middleware de autenticacao
function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = bearerToken(req);
  const user = auth.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Nao autenticado' });
  }
  req.user = user;
  next();
}

function requirePremium(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.premium) {
      return res.status(403).json({ success: false, message: 'Acesso exclusivo premium' });
    }
    next();
  });
}

// Conjunto de offsets premium por jogo (nome -> offset excecao para filtragem)
const premiumOffsetsPorJogo = {};
(premiumData.offsetsPremium || []).forEach(o => {
  if (!premiumOffsetsPorJogo[o.jogo]) premiumOffsetsPorJogo[o.jogo] = new Set();
  premiumOffsetsPorJogo[o.jogo].add(o.nome);
});

function ehPremiumOffset(jogo, nome) {
  const set = premiumOffsetsPorJogo[jogo];
  return !!(set && set.has(nome));
}

function podeVerPremium(req) {
  const token = bearerToken(req);
  const user = auth.getUserByToken(token);
  return !!(user && user.premium);
}

function filtrarPremium(entries, jogo, req) {
  if (podeVerPremium(req)) return entries;
  return entries.filter(entry => !ehPremiumOffset(jogo, entry.nome));
}

// Rotas da API

// GET - Listar todas as offsets
app.get('/api/offsets', (req, res) => {
  const premium = podeVerPremium(req);
  const data = { ...offsetsData };
  if (!premium && offsetsData.offsets) {
    data.offsets = Object.keys(offsetsData.offsets).reduce((acc, nome) => {
      if (!ehPremiumOffset('CS2', nome)) acc[nome] = offsetsData.offsets[nome];
      return acc;
    }, {});
  }
  res.json({
    success: true,
    data: data
  });
});

// GET - Offsets do CS2 especificamente
app.get('/api/offsets/cs2', (req, res) => {
  const premium = podeVerPremium(req);
  const data = { ...offsetsData };
  if (!premium && offsetsData.offsets) {
    data.offsets = Object.keys(offsetsData.offsets).reduce((acc, nome) => {
      if (!ehPremiumOffset('CS2', nome)) acc[nome] = offsetsData.offsets[nome];
      return acc;
    }, {});
  }
  res.json({
    success: true,
    jogo: data.jogo,
    versao: data.versao,
    data: data.data_pesquisa,
    offsets: data.offsets
  });
});

// GET - Todos os jogos
app.get('/api/offsets/todos', (req, res) => {
  const dados = {};
  for (const [jogo, entries] of Object.entries(allEntries())) {
    dados[jogo] = filtrarPremium(entries, jogo, req);
  }
  res.json({
    success: true,
    jogos: Object.keys(games),
    dados: dados
  });
});

// GET - Pesquisa em todas as offsets (API de pesquisa)
app.get('/api/offsets/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim();
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Informe o parametro q. Ex: /api/offsets/search?q=health'
    });
  }

  const resultados = [];
  for (const [game, entries] of Object.entries(allEntries())) {
    entries.forEach(entry => {
      if (!podeVerPremium(req) && ehPremiumOffset(game, entry.nome)) return;
      const busca = entry.nome + ' ' + entry.valor;
      if (busca.toLowerCase().includes(q)) {
        resultados.push({ jogo: game, ...entry });
      }
    });
  }

  res.json({
    success: true,
    q: q,
    total: resultados.length,
    resultados: resultados.slice(0, 500)
  });
});

// GET - Offset especifica por nome
app.get('/api/offsets/cs2/:nome', (req, res) => {
  const { nome } = req.params;
  if (ehPremiumOffset('CS2', nome) && !podeVerPremium(req)) {
    return res.status(403).json({ success: false, message: 'Offset exclusiva premium' });
  }
  const offset = offsetsData.offsets[nome];
  
  if (offset) {
    res.json({
      success: true,
      nome: nome,
      valor: offset
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Offset '${nome}' nao encontrada`
    });
  }
});

// GET - Offsets por categoria
app.get('/api/offsets/cs2/categoria/:categoria', (req, res) => {
  const { categoria } = req.params;
  const offsetsCategoria = offsetsData.categorias[categoria];
  
  if (offsetsCategoria) {
    const resultado = {};
    offsetsCategoria.forEach(nome => {
      if (offsetsData.offsets[nome]) {
        resultado[nome] = offsetsData.offsets[nome];
      }
    });
    
    res.json({
      success: true,
      categoria: categoria,
      offsets: resultado
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Categoria '${categoria}' nao encontrada`
    });
  }
});

// GET - Bonecs do CS2
app.get('/api/offsets/cs2/bonecs', (req, res) => {
  res.json({
    success: true,
    jogo: offsetsData.jogo,
    bonecs: offsetsData.bonecs
  });
});

// ====================================
// AUTENTICACAO
// ====================================

// POST - Registrar conta (envia codigo de verificacao)
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  const result = auth.register({ nome, email, senha });
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  const envio = await mailer.sendVerificationCode(result.email, result.code, nome);
  res.json({
    success: true,
    message: 'Conta criada. Verifique seu e-mail para confirmar.',
    simulado: envio.simulado || false,
    email: result.email
  });
});

// POST - Confirmar codigo de verificacao
app.post('/api/auth/verify', (req, res) => {
  const { email, codigo } = req.body;
  const result = auth.verify(email, codigo);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  const token = require('crypto').randomBytes(32).toString('hex');
  auth.setToken(result.user.email, token);
  result.user.token = token;
  res.json({ success: true, token, user: auth.publicUser(result.user) });
});

// POST - Reenviar codigo
app.post('/api/auth/resend', async (req, res) => {
  const { email } = req.body;
  const result = auth.resendCode(email);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  const envio = await mailer.sendVerificationCode(result.email, result.code, email);
  res.json({ success: true, simulado: envio.simulado || false, message: 'Codigo reenviado.' });
});

// POST - Login
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;
  const result = auth.login(email, senha);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  const token = require('crypto').randomBytes(32).toString('hex');
  auth.setToken(result.user.email, token);
  result.user.token = token;
  res.json({ success: true, token, user: auth.publicUser(result.user) });
});

// GET - Dados do usuario logado
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: auth.publicUser(req.user) });
});

// ====================================
// DISCORD - VERIFICACAO DE CODIGOS (OAuth2-like)
// Fluxo: bot gera codigo unico (15 min) -> usuario usa em /verificar.html
// ====================================

// GET - Valida um codigo gerado pelo bot (nao consome o codigo)
app.get('/api/verificar', rateLimit({ max: 5, janelaMs: 60 * 1000 }), (req, res) => {
  const codigo = (req.query.codigo || '').toString().trim().toUpperCase();
  if (!codigo) {
    return res.status(400).json({ success: false, valido: false, erro: 'Informe o codigo. Ex: /api/verificar?codigo=ABCD1234' });
  }

  const resultado = discordCodes.consultarCodigo(codigo);

  if (!resultado.ok) {
    const mensagens = {
      'nao-encontrado': 'Codigo invalido.',
      'usado': 'Codigo ja utilizado.',
      'expirado': 'Codigo expirado. Gere um novo no Discord.'
    };
    return res.status(400).json({ success: false, valido: false, erro: mensagens[resultado.motivo] || 'Codigo invalido.' });
  }

  res.json({
    success: true,
    valido: true,
    userId: resultado.userId,
    username: resultado.username,
    expiraEm: resultado.expiresAt
  });
});

// POST - Consome o codigo e faz login (cria a conta vinculada ao Discord se necessario)
app.post('/api/login', rateLimit({ max: 5, janelaMs: 60 * 1000 }), (req, res) => {
  const { codigo } = req.body || {};
  const c = (codigo || '').toString().trim().toUpperCase();
  if (!c) {
    return res.status(400).json({ success: false, valido: false, erro: 'Informe o codigo gerado no Discord.' });
  }

  const resultado = discordCodes.consultarCodigo(c);
  if (!resultado.ok) {
    const mensagens = {
      'nao-encontrado': 'Codigo invalido.',
      'usado': 'Codigo ja utilizado. Gere um novo no Discord.',
      'expirado': 'Codigo expirado. Gere um novo no Discord.'
    };
    return res.status(400).json({ success: false, valido: false, erro: mensagens[resultado.motivo] || 'Codigo invalido.' });
  }

  if (!discordCodes.marcarUsado(c)) {
    return res.status(400).json({ success: false, valido: false, erro: 'Codigo ja utilizado. Gere um novo.' });
  }

  const login = auth.loginComDiscord({ discordId: resultado.userId, username: resultado.username });
  if (!login.ok) {
    return res.status(500).json({ success: false, valido: false, erro: login.message || 'Falha ao criar a conta.' });
  }

  const jwt = assinarJwt({ userId: resultado.userId, username: login.user.email }, cfg.jwtSecret, 7 * 24 * 3600);

  res.json({
    success: true,
    valido: true,
    token: login.token,
    jwt,
    user: auth.publicUser(login.user),
    linkVerificar: cfg.publicUrl + '/verificar.html'
  });
});

// GET - Lista codigos do proprio usuario (via JWT ou token da sessao)
app.get('/api/meus-codigos', requireAuth, (req, res) => {
  res.json({ success: true, codigos: discordCodes.listarCodigos(req.user.discordId || req.user.email) });
});

// POST - Ativar premium (manual, apos pagamento via PIX)
app.post('/api/auth/premium', (req, res) => {
  const { email, chave } = req.body;
  const result = auth.activatePremium(email, chave, cfg.adminKey);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  res.json({ success: true, message: `Premium ativado para ${result.user.email}`, user: auth.publicUser(result.user) });
});

// GET - Planos da premium
app.get('/api/premium/planos', (req, res) => {
  res.json({
    success: true,
    planos: premiumData.planos,
    atualizadoEm: premiumData.atualizadoEm,
    nota: premiumData.nota
  });
});

// GET - Dados do PIX (chave + QR Code)
app.get('/api/pix/pagamento', async (req, res) => {
  const valor = req.query.valor ? parseFloat(req.query.valor) : cfg.pixAmount;
  const pixCfg = {
    pixKey: cfg.pixKey,
    pixName: cfg.pixName,
    pixCity: cfg.pixCity,
    pixAmount: valor || null,
    pixTxid: cfg.pixTxid
  };
  const data = await pix.generatePixData(pixCfg);
  res.json({ success: true, pagamento: data });
});

// GET - Conteudo premium (somente premium)
app.get('/api/premium/conteudo', requirePremium, (req, res) => {
  res.json({
    success: true,
    premium: true,
    apps: premiumData.appsPremium,
    offsets: premiumData.offsetsPremium,
    atualizadoEm: premiumData.atualizadoEm
  });
});

// POST - Adicionar nova offset
app.post('/api/offsets', (req, res) => {
  const { nome, valor } = req.body;
  
  if (!nome || !valor) {
    return res.status(400).json({
      success: false,
      message: 'Nome e valor sao obrigatorios'
    });
  }
  
  offsetsData.offsets[nome] = valor;
  
  // Salvar no arquivo
  fs.writeFileSync(offsetsPath, JSON.stringify(offsetsData, null, 2));
  
  res.json({
    success: true,
    message: `Offset '${nome}' adicionada com sucesso`,
    offset: { nome, valor }
  });
});

// PUT - Atualizar offset existente
app.put('/api/offsets/cs2/:nome', (req, res) => {
  const { nome } = req.params;
  const { valor } = req.body;
  
  if (!valor) {
    return res.status(400).json({
      success: false,
      message: 'Valor e obrigatorio'
    });
  }
  
  if (!offsetsData.offsets[nome]) {
    return res.status(404).json({
      success: false,
      message: `Offset '${nome}' nao encontrada`
    });
  }
  
  offsetsData.offsets[nome] = valor;
  
  // Salvar no arquivo
  fs.writeFileSync(offsetsPath, JSON.stringify(offsetsData, null, 2));
  
  res.json({
    success: true,
    message: `Offset '${nome}' atualizada com sucesso`,
    offset: { nome, valor }
  });
});

// DELETE - Remover offset
app.delete('/api/offsets/cs2/:nome', (req, res) => {
  const { nome } = req.params;
  
  if (!offsetsData.offsets[nome]) {
    return res.status(404).json({
      success: false,
      message: `Offset '${nome}' nao encontrada`
    });
  }
  
  delete offsetsData.offsets[nome];
  
  // Salvar no arquivo
  fs.writeFileSync(offsetsPath, JSON.stringify(offsetsData, null, 2));
  
  res.json({
    success: true,
    message: `Offset '${nome}' removida com sucesso`
  });
});

// Rota principal - servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let lanIP = '127.0.0.1';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
        lanIP = net.address;
      }
    }
  }
  console.log(`[SERVER] Rodando em http://0.0.0.0:${PORT}`);
  console.log(`[API] Disponivel em http://0.0.0.0:${PORT}/api/offsets`);
  console.log(`[API] Offsets CS2 em http://0.0.0.0:${PORT}/api/offsets/cs2`);
  console.log(`[API] Pesquisa em http://0.0.0.0:${PORT}/api/offsets/search?q=offset`);
  console.log(`[API] Auth em http://0.0.0.0:${PORT}/api/auth`);
  console.log(`[API] Premium em http://0.0.0.0:${PORT}/api/premium/planos`);
  console.log(`[API] Verificador de codigos Discord em http://0.0.0.0:${PORT}/api/verificar?codigo=XXXX`);
  console.log(`[API] Login via codigo em http://0.0.0.0:${PORT}/api/login`);
  console.log(`[NET] Na rede local: http://${lanIP}:${PORT}`);
  console.log(`[NET] Pagina de verificacao: http://${lanIP}:${PORT}/verificar.html`);
});

// Limpeza periodica de codigos expirados (a cada 5 minutos)
setInterval(() => {
  try { discordCodes.limparExpirados(); } catch (e) { /* sem impacto */ }
}, 5 * 60 * 1000);