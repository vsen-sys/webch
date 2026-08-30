// ====================================
// WEBCH - JWT (HS256) sem dependencias externas
// Cria e valida tokens JWT usando crypto nativo.
// ====================================
const crypto = require('crypto');

// Constantes fora do escopo de segredo (cabecalho fixo HS256)
const HEADER = Buffer.from(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' })
).toString('base64url');

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

// Assina um payload e devolve o JWT pronto
function assinarJwt(payload, secret, expiraEmSeg = 3600) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = {
    ...payload,
    iat: agora,
    exp: agora + expiraEmSeg
  };
  const dados = `${HEADER}.${base64url(corpo)}`;
  const assinatura = crypto.createHmac('sha256', secret).update(dados).digest('base64url');
  return `${dados}.${assinatura}`;
}

// Valida assinatura + expiracao. Retorna o payload ou null.
function verificarJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;

  const [h, p, s] = partes;
  const dados = `${h}.${p}`;
  const esperado = crypto.createHmac('sha256', secret).update(dados).digest('base64url');

  // Comparacao de tempo constante para evitar timing attack
  const a = Buffer.from(esperado);
  const b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }

  const agora = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= agora) return null;

  return payload;
}

module.exports = { assinarJwt, verificarJwt };