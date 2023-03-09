const { SlashCommandBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("confess")
    .setDescription("Send message anonymously.")
    .addStringOption((option) =>
      option
        .setName("confession")
        .setDescription("Message that you want to send")
        .setMaxLength(2000)
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setDescription("Attach something in your confession")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const msg = interaction.options.getString("confession");
      const attach = interaction.options.getAttachment("attachment");

      // Create the embed for the confession
      const embed = new EmbedBuilder()
        .setColor("#" + Math.floor(Math.random() * 16777215).toString(16))
        .setTitle(`Anonymous Confession`)
        .setDescription(`"${msg}"`)
        .setTimestamp();

      // Handle the invalid attachment
      if (attach) {
        if (!attach.contentType.startsWith("image")) {
          console.log(attach.contentType);
          await interaction.editReply({
            embeds: [
              {
                color: 0xf6c1cc,
                description:
                  ":x: Your attachment is not valid. The file must end in `.png`, `.jpg`, .`jpeg`, or .`gif`",
              },
            ],
          });
          return;
        } else {
          embed.setImage(attach.attachment);
        }
      }

      // Send the confirmation
      await interaction.editReply({
        embeds: [
          { color: 0xf6c1cc, description: "Your confession has been sent" },
        ],
        ephemeral: true,
      });

      // Send the confession
      await interaction.channel.send({ embeds: [embed] });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
