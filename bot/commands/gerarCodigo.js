// ====================================
// Comando /gerar-codigo
// Gera um codigo unico de 8 caracteres com validade de 15 minutos
// e responde com um embed bonito contendo o codigo e o link de uso.
// ====================================
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://192.168.1.107:8080';
const VALIDADE_MIN = 15;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gerar-codigo')
    .setDescription('Gera um codigo unico para entrar no WEBCH (valido por 15 minutos)'),

  async execute(interaction) {
    // Nao responder de imediato para permitir tempo de geracao
    await interaction.deferReply({ ephemeral: false });

    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      const { codigo, expiresAt } = db.gerarCodigo(userId, username, VALIDADE_MIN * 60 * 1000);

      const link = `${PUBLIC_URL}/verificar.html?codigo=${codigo}`;

      const embed = new EmbedBuilder()
        .setTitle('Codigo de acesso gerado')
        .setDescription(
          `**Seu codigo: \`${codigo}\`**\n\n` +
          `Entre em: [${link}](${link})\n` +
          `Ou digite o codigo na pagina de verificacao.`
        )
        .addFields(
          { name: 'Validade', value: `${VALIDADE_MIN} minutos`, inline: true },
          { name: 'Uso unico', value: 'Sim', inline: true },
          { name: 'Titular', value: `\`${username}\``, inline: true }
        )
        .setColor('#FFFFFF')
        .setFooter({ text: 'WEBCH - codigo unico, use uma vez e suma' })
        .setTimestamp(expiresAt);

      await interaction.editReply({ embeds: [embed] });
      console.log(`[BOT] /gerar-codigo -> ${username} (${userId}): ${codigo}`);
    } catch (error) {
      console.error('[BOT] Erro ao gerar codigo:', error.message);
      await interaction.editReply({ content: 'Falha ao gerar o codigo. Tente novamente em instantes.' });
    }
  }
};