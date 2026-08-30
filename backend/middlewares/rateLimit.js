// ====================================
// WEBCH - RATE LIMITING (por IP)
// Limite: maximo de N requisicoes por minuto por IP.
// Simples e sem dependencias (mapa em memoria, janela deslizante).
// ====================================

// Contadores por IP: ip -> { contador, janelaInicio }
const janelasPorIp = new Map();

// Verifica se o IP estourou o limite. Retorna { permitido, restante, resetAt }
function checarLimite(ip, max = 5, janelaMs = 60 * 1000) {
  const agora = Date.now();
  const chave = ip || 'unknown';

  const registro = janelasPorIp.get(chave);
  if (!registro || agora - registro.inicio >= janelaMs) {
    janelasPorIp.set(chave, { contador: 1, inicio: agora });
    return { permitido: true, restante: max - 1, resetAt: agora + janelaMs };
  }

  if (registro.contador >= max) {
    return { permitido: false, restante: 0, resetAt: registro.inicio + janelaMs };
  }

  registro.contador += 1;
  return { permitido: true, restante: max - registro.contador, resetAt: registro.inicio + janelaMs };
}

// Middleware pronta para o Express. Retorna 429 quando o limite for atingido.
// Uso: app.use('/api/verificar', rateLimit({ max: 5 }));
function rateLimit({ max = 5, janelaMs = 60 * 1000, mensagem = 'Muitas requisicoes. Aguarde um pouco.' } = {}) {
  return function middlewareRateLimit(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const resultado = checarLimite(ip, max, janelaMs);

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(resultado.restante));
    res.set('X-RateLimit-Reset', String(Math.ceil(resultado.resetAt / 1000)));

    if (!resultado.permitido) {
      const segundos = Math.max(1, Math.ceil((resultado.resetAt - Date.now()) / 1000));
      return res.status(429).json({
        success: false,
        message: mensagem,
        retryEmSegundos: segundos,
        rateLimit: true
      });
    }
    next();
  };
}

// Usado em testes para limpar o estado
function resetRateLimits() {
  janelasPorIp.clear();
}

module.exports = { checarLimite, rateLimit, resetRateLimits };