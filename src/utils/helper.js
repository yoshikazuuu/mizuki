const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const ICO = new AttachmentBuilder("assets/mizuki_sorry.png");

async function errorResponse(interaction, message) {
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("#F6C1CC")
        .setImage("attachment://mizuki_sorry.png")
        .setTitle(`Sorry. I can't do that, ${interaction.user.username}-san!`)
        .addFields({
          name: `Something's wrong *nii-sama!*`,
          value: `${message}`,
        })
        .setTimestamp(),
    ],
    files: [ICO],
  });
}

async function errorInteraction(interaction) {
  await interaction.editReply({
    emebeds: [
      new EmbedBuilder().setColor("#F6C1CC").setTitle(`Error`).addFields({
        name: "Something's wrong *nii-sama!*",
        value: "Error executing the command.",
      }),
    ],
  });
}

module.exports = { errorResponse, errorInteraction };
