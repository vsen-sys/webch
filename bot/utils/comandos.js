// ====================================
// WEBCH - REGISTRO DE COMANDOS DO BOT
// Registra os comandos slash no servidor (instante) e globalmente.
// ====================================
const { REST, Routes } = require('discord.js');

// Registra os comandos no(s) servidor(es) onde o bot esta (efeito imediato)
async function registrarComandos(client, comandos) {
  const guilds = [...client.guilds.cache.values()];
  if (!guilds.length) {
    console.log('[BOT] Nenhum servidor detectado ainda. Comandos globais pendentes.');
    return;
  }
  for (const guild of guilds) {
    try {
      await guild.commands.set(comandos.map(c => c.data.toJSON()));
      console.log(`[BOT] Comandos registrados em "${guild.name}"`);
    } catch (error) {
      console.error(`[BOT] Erro ao registrar em "${guild.name}":`, error.message);
    }
  }
}

// Tambem tenta registro global (cobre servidores futuros; leva ~1h para propagar)
async function registrarGlobal(comandos, clientId, token) {
  if (!clientId || !token) return;
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: comandos.map(c => c.data.toJSON()) }
    );
    console.log('[BOT] Comandos globais registrados com sucesso.');
  } catch (error) {
    console.warn('[BOT] Registro global falhou (pode usar so os de servidor):', error.message);
  }
}

module.exports = { registrarComandos, registrarGlobal };