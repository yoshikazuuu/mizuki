const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { token } = require("../../config.json");

const rest = new REST({ version: "10" }).setToken(token);

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

        id = id ? id.id : interaction.user.id;

        const data = await rest.get(Routes.user(id));

        const embed = new EmbedBuilder()
          .setColor("#F6C1CC")
          .setAuthor({
            name: "User Info",
          })
          .setTitle(`${data.username}#${data.discriminator}'s avatar.`)
          .setImage(
            `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.webp?size=512`
          )
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
