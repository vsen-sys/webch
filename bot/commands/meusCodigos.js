// ====================================
// Comando /meus-codigos
// Lista os codigos que o usuario ja gerou (sem expor o codigo em si,
// apenas status e horario - o banco guarda apenas o hash).
// ====================================
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meus-codigos')
    .setDescription('Mostra todos os codigos que voce ja gerou e o status de cada um'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const lista = db.listarCodigos(userId);

    const header = new EmbedBuilder()
      .setTitle('Meus codigos')
      .setColor('#FFFFFF')
      .setDescription(
        lista.length === 0
          ? 'Nenhum codigo gerado ainda. Use `/gerar-codigo` para criar um.'
          : `Total: ${lista.length} codigo(s).`
      );

    const rows = lista.slice(0, 20);

    let resumo = header;
    if (rows.length) {
      resumo.addFields(
        rows.map((r, i) => ({
          name: `#${i + 1} - ${r.status.toUpperCase()}`,
          value: [
            `ID: \`${r.hashResumo}...\``,
            `Criado: <t:${Math.floor(new Date(r.createdAt).getTime() / 1000)}:R>`,
            `Expira: <t:${Math.floor(r.expiresAt / 1000)}:R>`
          ].join('\n'),
          inline: false
        }))
      );
      resumo.setFooter({ text: 'O codigo em si nao e exibido por seguranca (armazenado com hash).' });
    }

    await interaction.reply({ embeds: [resumo], ephemeral: true });
  }
};