const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Mizuki's latency!"),
  async execute(interaction) {
    try {
      const message = await interaction.deferReply({ fetchReply: true });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#F6C1CC")
            .setTitle("Mizuki's delay to *nii-sama* is")
            .addFields(
              {
                name: "Client",
                value: `\`${
                  message.createdTimestamp - interaction.createdTimestamp
                }ms\``,
              },
              {
                name: "API",
                value: `\`${Math.round(interaction.client.ws.ping)}ms\``,
                inline: true,
              }
            )
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
            }),
        ],
      });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
