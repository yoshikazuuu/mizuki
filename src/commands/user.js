const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const { ERROR_LOG } = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("avatar")
        .setDescription("Show user's avatar.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription(
              "Tag another user or leave it blank to show your avatar."
            )
            .setRequired(false)
        )
    ),
  async execute(interaction) {
    try {
      if (interaction.options.getSubcommand() === "avatar") {
        let id = interaction.options.getUser("user");
        let avatar;

        if (id) {
          avatar = id.displayAvatarURL();
        } else {
          id = interaction.user;
          avatar = id.displayAvatarURL();
        }

        const embed = new EmbedBuilder()
          .setColor("#F6C1CC")
          .setAuthor({
            name: "User Info",
          })
          .setTitle(`${id.username}#${id.discriminator}'s avatar.`)
          .setImage(`${avatar}?size=512`)
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
          });

        await interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
