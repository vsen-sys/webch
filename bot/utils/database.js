// ====================================
// WEBCH - BASE DE DADOS COMPARTILHADA COM O BACKEND
// O bot e a API usam o MESMO sqlite (discord-codes.db).
// Nao duplicamos a logica: apenas reexportamos o modulo do backend.
// ====================================
const path = require('path');

module.exports = require(path.join(__dirname, '..', '..', 'backend', 'discord-codes-db.js'));