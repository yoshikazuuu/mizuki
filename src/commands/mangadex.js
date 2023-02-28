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
const { username_md, password_md } = require("../../config.json");
const { lookupService } = require("dns");
const creds = {
  username: username_md,
  password: password_md,
};

const ico = new AttachmentBuilder("assets/mangadex_icon.png");
const MANGADEX_ENDPOINT = "https://api.mangadex.org";

let sessionToken, refreshToken;

async function listChapters(interaction, id) {
  const dexTitle = await mangaInfo(id);
  const dexData = await searchChapter(id);

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
      (chapter, index) =>
        `**${index + 1}.** Vol. ${chapter.vol} Ch. ${chapter.chapter} - ${
          chapter.title
        }`
    )
    .join("\n");
  const cover_hash = dexTitle.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );

  const manga_title = dexTitle.data.data.attributes.title.en;
  const coverData = await getCover(cover_hash.id);
  const truncatedChapters = dexChaptersFormatted.slice(0, 2000);
  const cover_filename = coverData.data.data.attributes.fileName;

  await interaction.editReply({
    embeds: [
      embedContents(
        interaction,
        id,
        manga_title,
        cover_filename,
        truncatedChapters,
        true
      ),
    ],
    files: [ico],
  });
}

async function listSearchedTitle(interaction, title) {
  const dexData = await searchManga(title);
  const dexIDs = dexData.data.data.map((manga) => manga.id);
  const dexTitles = dexData.data.data
    .map((manga, index) => `**${index + 1}.** ${manga.attributes.title.en}`)
    .join("\n");

  console.log(dexIDs);
  await interaction.editReply({
    embeds: [
      embedContents(
        interaction,
        title,
        `Results of: ${title}`,
        null,
        dexTitles,
        false
      ),
    ],
    files: [ico],
  });
}

function embedContents(
  interaction,
  manga_id,
  manga_title,
  cover_filename,
  contents,
  isInChapter
) {
  let info = "";
  let url = "";
  let thumb = "";
  if (isInChapter) {
    info = `ID: ${manga_id}`;
    url = `https://mangadex.org/title/${manga_id}`;
    thumb = `https://uploads.mangadex.org/covers/${manga_id}/${cover_filename}.256.jpg`;
  } else {
    const query = manga_id.replace(/\s+/g, "+");
    info = `Query: ${manga_id}`;
    url = `https://mangadex.org/search?q=${query}`;
    thumb = `attachment://mangadex_icon.png`;
  }

  return new EmbedBuilder()
    .setColor(0xff6740)
    .setAuthor({
      name: "Mangadex Reader",
      iconURL: "attachment://mangadex_icon.png",
    })
    .setURL(url)
    .setThumbnail(thumb)
    .setDescription(contents)
    .setTimestamp()
    .setFooter({
      text: `${info}\nRequested by ${interaction.user.username}#${interaction.user.discriminator}`,
    })
    .setTitle(manga_title);
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
  const order = {
    rating: "desc",
    followedCount: "desc",
  };

  const finalOrderQuery = {};

  for (const [key, value] of Object.entries(order)) {
    finalOrderQuery[`order[${key}]`] = value;
  }

  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/manga`,
    params: {
      title: title,
      ...finalOrderQuery,
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

async function mangaInfo(title_id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/manga/${title_id}`,
  });

  return resp;
}

async function getCover(title_id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/cover/${title_id}`,
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

          listChapters(interaction, id);
          break;
        }

        case "search": {
          COMMAND_LOG(interaction, `/search`);

          listSearchedTitle(interaction, title_query);
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
