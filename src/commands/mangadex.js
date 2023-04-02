const { SlashCommandBuilder } = require("discord.js");

// Mangadex utils
const { subCommandTitleInfo } = require("./mangadex/info");
const { subCommandTitleSearch } = require("./mangadex/search");
const { subCommandChapterRead } = require("./mangadex/read");
const { subCommandChapterDownload } = require("./mangadex/download");

// Bot utils
const { COMMAND_LOG, ERROR_LOG } = require("../utils/logger");
const { errorResponse } = require("../utils/helper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mangadex")
    .setDescription("Mangadex related commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("read")
        .setDescription("Read Mangadex gallery.")
        .addStringOption((option) =>
          option.setName("id").setDescription("Chapter ID.").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription("Search Mangadex title.")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("Input title name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Get title info.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("Mangadex Title ID.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("download")
        .setDescription("Download Mangadex Chapter")
        .addStringOption((option) =>
          option.setName("id").setDescription("Chapter ID").setRequired(true)
        )
    ),

  async execute(interaction) {
    const id = interaction.options.getString("id");
    const title_query = interaction.options.getString("query");
    try {
      await interaction.deferReply({ fetchReply: true });
      if (id) {
        if (id.length !== 36) {
          errorResponse(interaction);
          return;
        }
      }
      switch (interaction.options.getSubcommand()) {
        case "read": {
          COMMAND_LOG(interaction, `/read`);
          await subCommandChapterRead(interaction, id);
          break;
        }
        case "search": {
          COMMAND_LOG(interaction, `/search`);
          await subCommandTitleSearch(interaction, title_query);
          break;
        }
        case "info":
          COMMAND_LOG(interaction, `/info`);
          await subCommandTitleInfo(interaction, id);
          break;
        case "download":
          COMMAND_LOG(interaction, `/download`);
          await subCommandChapterDownload(interaction, id);
          break;
        default:
          break;
      }
    } catch (err) {
      ERROR_LOG(err);
      errorResponse(interaction, err);
      console.error(err);
    }
  },
};
