const { SlashCommandBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/logger");
const { EmbedBuilder } = require("discord.js");
// const fs = require("fs");

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
      // // Check if the command was used in the specified channel
      // if (!fs.existsSync("configs/config_confess.json")) {
      //   interaction.reply({
      //     embeds: [
      //       {
      //         color: 0xf6c1cc,
      //         description:
      //           "No confession channels configured.\n**Ask your admin to configure it!**",
      //       },
      //     ],
      //     ephemeral: true,
      //   });
      //   return;
      // } else {
      //   const configData = JSON.parse(
      //     fs.readFileSync("configs/config_confess.json")
      //   );
      //   const guildID = interaction.guildId;

      //   // Check if the guild has any allowed channels
      //   if (
      //     !configData[guildID] ||
      //     !configData[guildID].includes(interaction.channel.id)
      //   ) {
      //     interaction.reply({
      //       embeds: [
      //         {
      //           color: 0xf6c1cc,
      //           description:
      //             "Confess can't be used in this channel, *nii-sama!*",
      //         },
      //       ],
      //       ephemeral: true,
      //     });
      //     return;
      //   }
      // }

      await interaction.deferReply({ ephemeral: true });
      const msg = interaction.options.getString("confession");
      const attach = interaction.options.getAttachment("attachment");
      let image = true;
      let file;

      // Create the embed for the confession
      const embed = new EmbedBuilder()
        .setColor("#" + Math.floor(Math.random() * 16777215).toString(16))
        .setTitle(`Anonymous Confession`)
        .setDescription(`"${msg}"`)
        .setTimestamp();

      // Handle the invalid attachment
      if (attach) {
        if (!attach.contentType.startsWith("image")) {
          image = false;
          file = attach.attachment;
        } else {
          embed.setImage(attach.attachment);
        }
      }

      // Send the confirmation
      await interaction.editReply({
        embeds: [
          {
            color: 0xf6c1cc,
            description: "Sending *nii-sama's* confession...  ",
          },
        ],
        ephemeral: true,
      });

      // Send the confession
      if (image) {
        await interaction.channel.send({ embeds: [embed] });
      } else {
        await interaction.channel
          .send({ embeds: [embed] })
          .then(async () => await interaction.channel.send({ files: [file] }));
      }
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
