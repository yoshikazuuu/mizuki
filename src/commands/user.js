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
        .addMentionableOption((option) =>
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
        let id = null;
        if (interaction.options.getString("user") === null) {
          id = interaction.user.id;
        } else {
          id = interaction.options.getString("user").match(/\d+/g).join("");
        }

        const fetchUser = async (id) => rest.get(Routes.user(id));

        fetchUser(id)
          .then((id) => {
            interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("#F6C1CC")
                  .setAuthor({
                    name: "User Info",
                  })
                  .setTitle(`${id.username}#${id.discriminator}'s avatar.`)
                  .setImage(
                    `https://cdn.discordapp.com/avatars/${id.id}/${id.avatar}.webp?size=512`
                  )
                  .setTimestamp()
                  .setFooter({
                    text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
                  }),
              ],
            });
          })
          .catch((e) => ERROR_LOG(e));
      }
    } catch (e) {
      ERROR_LOG(e);
    }
  },
};
