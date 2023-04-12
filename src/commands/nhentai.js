const axios = require("axios");
const { SlashCommandBuilder } = require("discord.js");

const { nhenDownloader } = require("./nhentai/download");
const { nhenInfo } = require("./nhentai/info");
const { nhenReader } = require("./nhentai/reader");
const { embedNSFW } = require("./nhentai/utils/ui");
const {
  COOLDOWNS,
  NHENTAI_CUSTOM_ENDPOINT,
  NHENTAI_RANDOM_ENDPOINT,
} = require("../utils/constants");
const { errorResponse } = require("../utils/helper");
const { COMMAND_LOG, ERROR_LOG } = require("../utils/logger");
const { cooldownEmbed } = require("../utils/ui");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nhen")
    .setDescription("nHentai related commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("read")
        .setDescription("Read nHentai gallery.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("nHentai gallery code.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription("Read random nHentai gallery.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Get info about nHentai gallery.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("nHentai gallery code.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("download")
        .setDescription("Download nHentai gallery.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("nHentai gallery code.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const galleryCode = interaction.options.getString("code");

    try {
      // Check if the channel is NSFW
      if (!interaction.channel.nsfw) {
        await interaction.reply({
          embeds: [embedNSFW],
          ephemeral: true,
        });
        return;
      }

      // Check if the user is on cooldown
      const cooldowns = new Map();
      const { id } = interaction.member.user;
      if (cooldowns.has(id)) {
        const cooldown = cooldowns.get(id);
        const remainingTime = cooldown - interaction.createdTimestamp;
        if (remainingTime > 0) {
          return interaction.reply({
            embeds: [cooldownEmbed(remainingTime)],
            ephemeral: true,
          });
        }
      }
      const messageCreated = await interaction.deferReply({ fetchReply: true });
      cooldowns.set(id, messageCreated.createdTimestamp + COOLDOWNS);

      // Fetch data from nHentai API
      const { data } = await axios.get(
        galleryCode
          ? NHENTAI_CUSTOM_ENDPOINT + galleryCode
          : NHENTAI_RANDOM_ENDPOINT
      );

      switch (interaction.options.getSubcommand()) {
        case "read":
          COMMAND_LOG(
            interaction,
            `/read for ${data.data.optional_title.pretty}`
          );

          nhenReader(data, interaction, false);
          break;
        case "random":
          COMMAND_LOG(
            interaction,
            `/random for ${data.data.optional_title.pretty}`
          );

          nhenInfo(data, interaction);
          break;
        case "info":
          COMMAND_LOG(
            interaction,
            `/info for ${data.data.optional_title.pretty}`
          );

          nhenInfo(data, interaction);
          break;
        case "download":
          COMMAND_LOG(interaction, `/download for ${galleryCode}`);

          nhenDownloader(interaction, data);
          break;
        default:
          break;
      }

      setTimeout(() => cooldowns.delete(id), COOLDOWNS);
    } catch (err) {
      console.error(err);
      errorResponse(interaction, err);
      ERROR_LOG(err);
    }
  },
};
