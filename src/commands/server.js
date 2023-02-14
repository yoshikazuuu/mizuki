const { SlashCommandBuilder, EmbedBuilder, time } = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Provides information about the server."),
  async execute(interaction) {
    try {
      const timeCreated = Math.round(
        interaction.guild.createdAt.getTime() / 1000
      );

      const server_embed = new EmbedBuilder()
        .setColor("#F6C1CC")
        .setAuthor({
          name: "Server Info",
        })
        .setTitle(interaction.guild.name)
        .setThumbnail(
          `https://cdn.discordapp.com/icons/${interaction.guildId}/${interaction.guild.icon}.webp?size=512`
        )
        .addFields(
          {
            name: "Member",
            value: `${interaction.guild.memberCount}`,
            inline: true,
          },
          {
            name: "Owner",
            value: `<@${interaction.guild.ownerId}>`,
            inline: true,
          },
          {
            name: "Date created",
            value: `<t:${timeCreated}> (${Math.round(
              (Date.now() / 1000 - timeCreated) / (60 * 60 * 24)
            )} days ago) `,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
        });

      await interaction.reply({ embeds: [server_embed] });
    } catch (e) {
      ERROR_LOG(e);
    }
  },
};
