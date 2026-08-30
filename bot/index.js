// ====================================
// WEBCH - BOT DO DISCORD
// Gera codigos unicos para verificacao/login no site.
// Compartilha o mesmo banco SQLite do backend (discord-codes.db).
// ====================================
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');

// Carrega o .env do backend (mesmo arquivo de configuracao do site)
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { registrarComandos, registrarGlobal } = require('./utils/comandos');
const gerarCodigo = require('./commands/gerarCodigo');
const meusCodigos = require('./commands/meusCodigos');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error('[BOT] DISCORD_TOKEN nao configurado em backend/.env. O bot nao vai iniciar.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const comandos = new Map();
comandos.set(gerarCodigo.data.name, gerarCodigo);
comandos.set(meusCodigos.data.name, meusCodigos);

// Registra os comandos (slash) e responde
client.once('ready', async () => {
  console.log(`[BOT] Logado como ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('/gerar-codigo', { type: ActivityType.Watching });

  await registrarComandos(client, Array.from(comandos.values()));
  await registrarGlobal(Array.from(comandos.values()), process.env.DISCORD_CLIENT_ID, TOKEN);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const cmd = comandos.get(interaction.commandName);
  if (!cmd) {
    return interaction.reply({ content: 'Comando desconhecido.', ephemeral: true });
  }

  try {
    await cmd.execute(interaction, { client });
  } catch (error) {
    console.error(`[BOT] Erro no comando /${interaction.commandName}:`, error.message);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: 'Ocorreu um erro interno. Tente de novo.' });
      } else {
        await interaction.reply({ content: 'Ocorreu um erro interno. Tente de novo.', ephemeral: true });
      }
    } catch (e) { /* sem resposta possivel */ }
  }
});

client.login(TOKEN)