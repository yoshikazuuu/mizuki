const { SlashCommandBuilder, Events } = require("discord.js");

// Mangadex utils
const { ICO } = require("./mangadex/constants");
const {
  fetchCoverData,
  getMangaTitleAndCover,
  getDataFromChapter,
  searchManga,
  getLinkImage,
  getMangaInfo,
  getListChapters,
  mapDexDataToJSON,
} = require("./mangadex/api");
const {
  buildSearchEmbed,
  info_buttons,
  embed_reader,
  buttons,
  menu_builder,
  embedContents,
  buildEmbed,
} = require("./mangadex/ui");
const downloadChapter = require("./mangadex/download");

// Bot utils
const { COMMAND_LOG, ERROR_LOG } = require("../utils/log_template");
const { errorResponse } = require("../utils/helper");
const { createCollector } = require("../utils/collector");

async function titleInfo(interaction, title_id) {
  let readingStatus = false;
  const dexData = await getMangaInfo(title_id);
  const coverData = await fetchCoverData(dexData);
  const embed = buildEmbed(dexData, coverData, interaction, title_id);
  const btn = info_buttons(
    "Mangadex",
    `https://mangadex.org/title/${title_id}`
  );

  let m = await interaction.followUp({
    embeds: [embed],
    components: [btn],
    files: [ICO],
  });

  const collector = createCollector(m, interaction);
  await handleCollectorEvents(
    collector,
    readingStatus,
    interaction,
    title_id,
    btn,
    m
  );
}

async function handleCollectorEvents(
  collector,
  readingStatus,
  interaction,
  title_id,
  btn,
  m
) {
  collector.on("collect", async (i) => {
    if (i.customId === "read") {
      readingStatus = true;
      i.deferUpdate();
      collector.stop();
      return;
    }
  });

  collector.on("end", async () => {
    if (readingStatus) {
      await paginatedChapterSelector(interaction, title_id);
    } else {
      btn.components[0].setDisabled(true);
      await m.edit({
        components: [btn],
      });
    }
  });
}

async function readChapter(
  interaction,
  id,
  title_name,
  data_id,
  info_chapters
) {
  let page_number = 0;
  const { data } = await getLinkImage(id);

  const dexData = data.chapter.data.map((img) => {
    const link = `${data.baseUrl}/data/${data.chapter.hash}/${img}`;
    return link;
  });

  let index = data_id.findIndex((chapter) => chapter.id === id);
  const selected_chapter = info_chapters[index];
  const dataJSON = {
    id: id,
    title: title_name,
    source: `https://mangadex.org/chapter/${id}`,
    image: dexData,
    chapters_id: data_id,
    location: selected_chapter,
    index,
  };

  let buttons_embed = buttons(page_number, dataJSON.image.length);
  let m = await interaction.editReply({
    embeds: [embed_reader(interaction, page_number, dataJSON)],
    components: [buttons_embed],
    files: [ICO],
  });

  const collector = createCollector(m, interaction);
  collector.on("collect", async (i) => {
    collector.resetTimer();

    let change_chapter = false;

    const actions = {
      next: () => Math.min(page_number + 1, dataJSON.image.length - 1),
      prev: () => Math.max(page_number - 1, 0),
      first: () => {
        index = Math.max(index - 1, 0);
        change_chapter = true;
      },
      last: () => {
        index = Math.min(index + 1, dataJSON.chapters_id.length);
        change_chapter = true;
      },
    };

    page_number = actions[i.customId] ? actions[i.customId]() : page_number;
    buttons_embed = buttons(page_number, dataJSON.image.length);

    await i.update({
      embeds: [embed_reader(interaction, page_number, dataJSON)],
      components: [buttons_embed],
      files: [ICO],
    });

    if (change_chapter) {
      collector.stop();
      readChapter(
        interaction,
        dataJSON.chapters_id[index].id,
        title_name,
        data_id,
        info_chapters
      );
    }
  });

  collector.on("end", async () => {
    for (let i = 0; i < buttons_embed.components.length; i++) {
      const btn = buttons_embed.components[i];
      btn.setDisabled(true);
    }
    await m.edit({
      components: [buttons_embed],
    });
  });
}

async function updateComponents(
  i,
  interaction,
  id,
  mangaTitle,
  coverFilename,
  pageNumber,
  chaptersJSON,
  chaptersBold
) {
  const button = buttons(pageNumber, chaptersJSON.length);
  const selector = menu_builder("Select Chapter", chaptersJSON[pageNumber]);
  const embed = embedContents(
    interaction,
    id,
    mangaTitle,
    coverFilename,
    chaptersBold[pageNumber].join("\n"),
    true
  );

  await i.update({
    embeds: [embed],
    components: [button, selector],
    files: [ICO],
  });
}

async function paginatedChapterSelector(interaction, id) {
  const {
    paginatedDexChaptersJSON: chaptersJSON,
    paginatedDexChaptersBold: chaptersBold,
    dexData,
    dexChapters,
    chapters,
  } = await getListChapters(id);

  const { mangaTitle, coverFilename } = await getMangaTitleAndCover(id);
  let updated = false;
  let readingStatus = false;
  let pageNumber = 0;

  let embed = embedContents(
    interaction,
    id,
    mangaTitle,
    coverFilename,
    chaptersBold[pageNumber].join("\n"),
    true
  );

  let button = buttons(pageNumber, chaptersJSON.length);
  let selector = menu_builder("Select Chapter", chaptersJSON[pageNumber]);

  let m = await interaction.editReply({
    embeds: [embed],
    components: [button, selector],
    files: [ICO],
  });

  const collector = createCollector(m, interaction);
  collector.on("collect", async (i) => {
    collector.resetTimer();

    const actions = {
      next: () => Math.min(pageNumber + 1, chaptersJSON.length - 1),
      prev: () => Math.max(pageNumber - 1, 0),
      first: () => 0,
      last: () => chaptersJSON.length - 1,
    };

    pageNumber = actions[i.customId] ? actions[i.customId]() : pageNumber;

    await updateComponents(
      i,
      interaction,
      id,
      mangaTitle,
      coverFilename,
      pageNumber,
      chaptersJSON,
      chaptersBold
    );
  });

  collector.on("end", async () => {
    if (readingStatus) {
      for (let i = 0; i < button.components.length; i++) {
        const btn = button.components[i];
        btn.setDisabled(true);
      }
      await m.edit({
        components: [button],
      });
    }
  });

  interaction.client.on(Events.InteractionCreate, async (i) => {
    if (!i.isStringSelectMenu()) return;

    const selected = i.values[0];
    if (
      dexData.data.data.find((entry) => entry.id === selected) !== undefined &&
      !updated
    ) {
      updated = true;
      readingStatus = true;
      collector.stop();
      readChapter(interaction, selected, mangaTitle, chapters, dexChapters);
    }
  });
}

async function listSearchedTitle(interaction, title) {
  const dexData = await searchManga(title);
  const embed_title = `Results of: ${title}`;

  let updated = false;
  interaction.client.on(Events.InteractionCreate, async (i) => {
    if (!i.isStringSelectMenu()) return;

    const selected = i.values[0];

    if (
      dexData.data.data.find((id) => id.id == selected) != undefined &&
      !updated
    ) {
      updated = true;
      i.deferUpdate().then(paginatedChapterSelector(interaction, selected));
    }
  });

  const titlesJSON = mapDexDataToJSON(dexData);
  const searchEmbed = buildSearchEmbed(
    interaction,
    title,
    embed_title,
    titlesJSON
  );

  await interaction.editReply({
    embeds: [searchEmbed],
    files: [ICO],
    components: [menu_builder("Select Title", titlesJSON)],
  });
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
    await interaction.deferReply({ fetchReply: true });

    const id = interaction.options.getString("id");
    const title_query = interaction.options.getString("query");
    try {
      switch (interaction.options.getSubcommand()) {
        case "read": {
          COMMAND_LOG(interaction, `/read`);

          const data = await getDataFromChapter(id);
          readChapter(
            interaction,
            data.chapterID,
            data.mangaTitle,
            data.chapters,
            data.dexChapters
          );
          break;
        }

        case "search": {
          COMMAND_LOG(interaction, `/search`);

          listSearchedTitle(interaction, title_query);
          break;
        }

        case "info":
          COMMAND_LOG(interaction, `/info`);

          titleInfo(interaction, id);
          break;
        case "download":
          COMMAND_LOG(interaction, `/download`);

          downloadChapter(interaction, id);
          break;
        default:
          break;
      }
    } catch (err) {
      const hashed_id = id ? id : title_query;
      if (
        err.response &&
        (err.response.status >= 400 || err.response.status <= 499)
      ) {
        ERROR_LOG(err);
        errorResponse(interaction, hashed_id, err);
      } else {
        ERROR_LOG(err);
      }
    }
  },
};
