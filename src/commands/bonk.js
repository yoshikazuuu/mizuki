const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");
const Canvas = require("@napi-rs/canvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bonk")
    .setDescription("Bonk.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Tag another user or leave it blank to bonk yourself.")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userBonker = interaction.user;
      const userBonked = interaction.options.getUser("user");

      // Load image to canvas
      const [avatarBonker, avatarBonked] = await Promise.all([
        Canvas.loadImage(`${userBonker.displayAvatarURL()}?size=512`),
        Canvas.loadImage(`${userBonked.displayAvatarURL()}?size=512`),
      ]);

      const usernameBonked = `${userBonked.username}#${userBonked.discriminator}`;

      // Load the canvas to draw on
      const canvas = Canvas.createCanvas(1080, 720);
      const context = canvas.getContext("2d");
      const background = await Canvas.loadImage(
        `https://cdn.discordapp.com/attachments/714847546903625790/1082151691891265596/bonk.png`
      );

      // This uses the canvas dimensions to stretch the image onto the entire canvas
      context.drawImage(avatarBonker, 324, 128, 204, 204);
      context.drawImage(avatarBonked, 661, 337, 137, 137);
      context.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Use the helpful Attachment class structure to process the file for you
      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "bonk.png",
      });

      // Create the embed
      const embed = new EmbedBuilder()
        .setColor(`#F6C1CC`)
        .setImage(`attachment://bonk.png`)
        .setDescription(
          `**${interaction.user.username}#${interaction.user.discriminator}** bonked **${usernameBonked}**`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
