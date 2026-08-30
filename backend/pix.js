// ====================================
// PIX - Geracao de BR Code (Copia e Cola) + QR Code
// ====================================
const QRCode = require('qrcode');

function normalize(value) {
  return String(value);
}

function emvField(id, value) {
  const v = normalize(value);
  return id + String(v.length).padStart(2, '0') + v;
}

function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildBrCode(cfg) {
  const payloadFormat = emvField('00', '01');
  const gui = emvField('00', 'br.gov.bcb.pix');
  const chave = emvField('01', cfg.pixKey);
  const descricao = cfg.pixLabel ? emvField('02', cfg.pixLabel) : '';
  const merchantAccount = emvField('26', gui + chave + descricao);
  const mcc = emvField('52', '0000');
  const currency = emvField('53', '986');
  const amount = cfg.pixAmount ? emvField('54', cfg.pixAmount.toFixed(2)) : '';
  const country = emvField('58', 'BR');
  const merchantName = emvField('59', cfg.pixName || 'WEBCH PREMIUM');
  const merchantCity = emvField('60', cfg.pixCity || 'BRASILIA');
  const txid = emvField('05', cfg.pixTxid || '***');
  const additionalData = emvField('62', txid);

  const base = payloadFormat + merchantAccount + mcc + currency + amount + country + merchantName + merchantCity + additionalData;
  const crc = crc16(base + '6304');
  return base + '6304' + crc;
}

async function generatePixData(cfg) {
  const brCode = buildBrCode(cfg);
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(brCode, {
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch (e) {
    console.error('[PIX] Erro ao gerar QR Code:', e.message);
  }
  return {
    brCode,
    qrDataUrl,
    chave: cfg.pixKey,
    valor: cfg.pixAmount || null,
    nome: cfg.pixName || 'WEBCH PREMIUM',
    cidade: cfg.pixCity || 'BRASILIA'
  };
}

module.exports = { generatePixData, buildBrCode };