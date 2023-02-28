const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const axios = require("axios");
const { COMMAND_LOG, ERROR_LOG } = require("../utils/log_template");
const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const { username_md, password_md } = require("../../config.json");
const creds = {
  username: username_md,
  password: password_md,
};

let sessionToken, expires, refreshToken;

function listChapters(data) {
  const dexChapters = dexData.data.data.map((manga) => ({
    id: manga.id,
    vol: manga.attributes.volume,
    chapter: manga.attributes.chapter,
    title: manga.attributes.title,
  }));
  const sortedDexChapters = dexChapters.sort((a, b) => {
    if (a.vol !== b.vol) {
      return a.vol - b.vol;
    } else {
      return a.chapter - b.chapter;
    }
  });
  const dexChaptersFormatted = sortedDexChapters
    .map(
      (chapter) =>
        `Vol. ${chapter.vol} Ch. ${chapter.chapter} - ${chapter.title}`
    )
    .join("\n");
  const truncatedChapters = dexChaptersFormatted.slice(0, 2000);

  return new EmbedBuilder()
    .setColor(0xff6740)
    .setAuthor({
      name: "nHentai Reader",
      iconURL: "attachment://nhentai_icon.jpg",
      url: "",
    })
    .setTitle.setURL()
    .setTimestamp()
    .setFooter();
}

async function errorResponse(interaction, id, error) {
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("#F6C1CC")
        .setTitle(`(Status ${error.response.status})`)
        .addFields({
          name: `Something's wrong with the API`,
          value: `Try to open it manually using this link!`,
        }),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Mangadex")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://mangadex.org/title/${id}`)
      ),
    ],
  });
}

(async () => {
  const resp = await axios({
    method: "POST",
    url: `${MANGADEX_ENDPOINT}/auth/login`,
    headers: {
      "Content-Type": "application/json",
    },
    data: creds,
  });
  refreshToken = resp.data.token.refresh;
})();

setInterval(async () => {
  const resp = await axios({
    method: "POST",
    url: `${MANGADEX_ENDPOINT}/auth/refresh`,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      token: refreshToken,
    },
  });

  sessionToken = resp.data.token.session;
}, 15 * 60 * 1000);

async function searchManga(title) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/manga`,
    params: {
      title: title,
    },
  });

  return resp;
}

async function searchChapter(title_id) {
  const languages = ["en"];

  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/manga/${title_id}/feed`,
    params: {
      translatedLanguage: languages,
    },
  });

  return resp;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mangadex")
    .setDescription("Mangadex related commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("read")
        .setDescription("Read Mangadex gallery.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("Mangadex gallery code.")
            .setRequired(true)
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
    await interaction.deferReply({ fetchReply: true });
    const id = interaction.options.getString("id");
    const title_query = interaction.options.getString("query");
    try {
      switch (interaction.options.getSubcommand()) {
        case "read": {
          COMMAND_LOG(interaction, `/read`);

          const dexData = await searchChapter(id);

          await interaction.editReply(truncatedChapters);

          break;
        }

        case "search": {
          COMMAND_LOG(interaction, `/search`);

          const dexData = await searchManga(title_query);
          const dexIDs = dexData.data.data.map((manga) => manga.id);
          const dexTitles = dexData.data.data.map(
            (manga) => manga.attributes.title.en
          );
          await interaction
            .editReply(dexTitles.join("\n"))
            .then(console.log(dexIDs));
          break;
        }

        case "info":
          COMMAND_LOG(interaction, `/info`);

          await interaction.editReply(id);
          break;
        case "download":
          COMMAND_LOG(interaction, `/download`);

          await interaction.editReply(id);
          break;
        default:
          break;
      }
    } catch (error) {
      const hashed_id = id ? id : title_query;
      if (
        error.response &&
        (error.response.status >= 400 || error.response.status <= 499)
      ) {
        ERROR_LOG(error);
        errorResponse(interaction, hashed_id, error);
      } else {
        ERROR_LOG(error);
      }
    }
  },
};
