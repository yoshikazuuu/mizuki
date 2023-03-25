const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  Events,
} = require("discord.js");
const axios = require("axios");
const { COMMAND_LOG, ERROR_LOG } = require("../utils/log_template");

const ico = new AttachmentBuilder("assets/mangadex_icon.png");
const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const TIMEOUT = 60 * 1000;
const wrongUser = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

function info_buttons(title_link, source) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("read")
      .setEmoji("📖")
      .setLabel("Read")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel(title_link)
      .setStyle(ButtonStyle.Link)
      .setURL(source)
  );
}

function buttons(page_number, data) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("first")
      .setEmoji("956179957359443988")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("prev")
      .setEmoji("956179957644685402")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("page_number")
      .setLabel(`${page_number + 1}/${data.image.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("next")
      .setEmoji("956179957464313876")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("last")
      .setEmoji("956179957531418655")
      .setStyle(ButtonStyle.Primary)
  );
}

function embed_reader(interaction, page_number, data) {
  return new EmbedBuilder()
    .setColor(0xff6740)
    .setAuthor({
      name: "Mangadex Reader",
      iconURL: "attachment://mangadex_icon.png",
    })
    .setTitle(data.title)
    .setURL(data.source)
    .setDescription(data.location)
    .setImage(data.image[page_number])
    .setTimestamp()
    .setFooter({
      text: `ID: ${data.id}\nRequested by ${interaction.user.username}#${interaction.user.discriminator}`,
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

function menu_builder(placeholder, dataJSON) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select")
      .setPlaceholder(placeholder)
      .addOptions(dataJSON)
  );
}

async function titleInfo(interaction, title_id) {
  let readingStatus = false;
  const dexData = await mangaInfo(title_id);
  const cover_hash = dexData.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );
  const coverData = await getCover(cover_hash.id);
  const cover_filename = coverData.data.data.attributes.fileName;
  const md = dexData.data.data;
  const source = `https://mangadex.org/title/${md.id}`;

  const btn = info_buttons("Mangadex", source);

  const format = md.attributes.tags
    .filter((tag) => tag.attributes.group === "format")
    .map((tag) => tag.attributes.name.en)
    .join(", ");

  const genres = md.attributes.tags
    .filter((tag) => tag.attributes.group === "genre")
    .map((tag) => tag.attributes.name.en)
    .join(", ");

  const embed = new EmbedBuilder()
    .setColor(0xff6740)
    .setAuthor({
      name: "Mangadex Reader",
      iconURL: "attachment://mangadex_icon.png",
    })
    .setURL(source)
    .setThumbnail(
      `https://uploads.mangadex.org/covers/${title_id}/${cover_filename}.256.jpg`
    )
    .setDescription(md.attributes.description.en)
    .addFields(
      {
        name: `Formats`,
        value: `${format}`,
      },
      {
        name: `Genres`,
        value: `${genres}`,
      },
      {
        name: `Status`,
        value: `${md.attributes.status}`,
      },
      {
        name: `Release Year`,
        value: `${md.attributes.year}`,
      },
      {
        name: `Original Languange`,
        value: `${md.attributes.originalLanguage}`,
      }
    )
    .setTimestamp()
    .setFooter({
      text: `ID: ${title_id}\nRequested by ${interaction.user.username}#${interaction.user.discriminator}`,
    })
    .setTitle(md.attributes.title.en);

  let m = await interaction.followUp({
    embeds: [embed],
    components: [btn],
    files: [ico],
  });

  const filter = (button) => {
    if (button.user.id === interaction.member.user.id) return true;
    return button.reply({ embeds: [wrongUser], ephemeral: true });
  };

  const collector = m.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "read") {
      readingStatus = true;
      await i.update({
        embeds: [embed],
        components: [btn],
        files: [ico],
      });
      collector.stop();
      return;
    }
  });

  collector.on("end", async () => {
    if (readingStatus) {
      await listChapters(interaction, title_id);
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

  let buttons_embed = buttons(page_number, dataJSON);
  let m = await interaction.editReply({
    embeds: [embed_reader(interaction, page_number, dataJSON)],
    components: [buttons_embed],
    files: [ico],
  });

  const filter = (button) => {
    if (button.user.id !== interaction.member.user.id) {
      button.reply({ embeds: [wrongUser], ephemeral: true });
      return false;
    }
    return true;
  };

  const collector = m.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });

  collector.on("collect", async (i) => {
    collector.resetTimer();

    let change_chapter = false;

    switch (i.customId) {
      case "next":
        page_number = Math.min(page_number + 1, dataJSON.image.length - 1);
        break;
      case "prev":
        page_number = Math.max(page_number - 1, 0);
        break;
      case "first":
        index = Math.max(index - 1, 0);
        change_chapter = true;
        break;
      case "last":
        index = Math.min(index + 1, dataJSON.chapters_id.length);
        change_chapter = true;
        break;
      default:
        break;
    }

    buttons_embed = buttons(page_number, dataJSON);

    await i.update({
      embeds: [embed_reader(interaction, page_number, dataJSON)],
      components: [buttons_embed],
      files: [ico],
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

async function readChapterPrep(chapter_id) {
  const manga_id = await getMangaFromChapter(chapter_id);
  const dexTitle = await mangaInfo(manga_id);
  const dexData = await searchChapter(manga_id);

  const manga_title = dexTitle.data.data.attributes.title.en;
  const chapters = dexData.data.data
    .map((manga) => ({
      id: manga.id,
      vol: manga.attributes.volume,
      chapter: manga.attributes.chapter,
      title: manga.attributes.title,
    }))
    .sort((a, b) => {
      if (a.vol !== b.vol) {
        return a.vol - b.vol;
      } else {
        return a.chapter - b.chapter;
      }
    });

  const dexChapters = chapters.map(
    (chapter) =>
      `${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
        chapter.chapter ? `Ch. ${chapter.chapter}` : ``
      }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
        chapter.title ? `${chapter.title}` : ``
      }`
  );

  return {
    mangaID: manga_id,
    chapterID: chapter_id,
    mangaTitle: manga_title,
    chapters: chapters,
    dexChapters: dexChapters,
  };
}

async function listChapters(interaction, id) {
  const dexTitle = await mangaInfo(id);
  const dexData = await searchChapter(id);
  let chapters, dexChapters, dexChaptersBold, dexChaptersJSON;

  if (dexData.data.data.length != 0) {
    chapters = dexData.data.data
      .map((manga) => ({
        id: manga.id,
        vol: manga.attributes.volume,
        chapter: manga.attributes.chapter,
        title: manga.attributes.title,
      }))
      .sort((a, b) => {
        if (a.vol !== b.vol) {
          return a.vol - b.vol;
        } else {
          return a.chapter - b.chapter;
        }
      });

    dexChaptersBold = chapters.map(
      (chapter, index) =>
        `**${index + 1}.** ${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
          chapter.chapter ? `Ch. ${chapter.chapter}` : ``
        }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
          chapter.title ? `${chapter.title}` : ``
        }`
    );

    dexChapters = chapters.map(
      (chapter) =>
        `${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
          chapter.chapter ? `Ch. ${chapter.chapter}` : ``
        }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
          chapter.title ? `${chapter.title}` : ``
        }`
    );

    dexChaptersJSON = dexChapters.slice(0, 25).map((chapter, index) => {
      const id = dexData.data.data[index].id;
      const label =
        (dexChapters[index] && dexChapters[index].slice(0, 100)) || "N/A";
      const description = id;
      const value = id;
      return {
        label,
        description,
        value,
      };
    });
  } else {
    dexChaptersBold = "***NO CHAPTER AVAILABLE.***";
    dexChapters = "NO CHAPTER AVAILABLE";
    dexChaptersJSON = {
      label: "NO CHAPTER AVAILABLE",
      description: "sadge",
      value: "sadge",
    };
  }

  const cover_hash = dexTitle.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );
  const coverData = await getCover(cover_hash.id);
  const cover_filename = coverData.data.data.attributes.fileName;
  const manga_title = dexTitle.data.data.attributes.title.en;
  const truncatedChapters = dexChaptersBold.join(`\n`).slice(0, 2000);

  let updated = false;
  interaction.client.on(Events.InteractionCreate, async (i) => {
    if (!i.isStringSelectMenu()) return;

    const selected = i.values[0];
    if (
      dexData.data.data.find((id) => id.id == selected) != undefined &&
      !updated
    ) {
      updated = true;

      await i
        .deferUpdate()
        .then(
          readChapter(interaction, selected, manga_title, chapters, dexChapters)
        );
    }
  });

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
    components: [menu_builder("Select Chapter", dexChaptersJSON)],
    files: [ico],
  });
}

async function listSearchedTitle(interaction, title) {
  const dexData = await searchManga(title);
  const embed_title = `Results of: ${title}`;

  const dexTitles = dexData.data.data
    .map(
      (manga, index) =>
        `**${index + 1}. ${manga.attributes.title.en}**\n*ID: ${
          dexData.data.data[index].id
        }*\n`
    )
    .join("\n");

  const dexTitlesJSON = dexData.data.data.map((manga, index) => {
    const title = manga.attributes.title.en;
    const id = dexData.data.data[index].id;
    const label = (title && title.slice(0, 100)) || "N/A";
    const description = (id && `ID: ${id}`.slice(0, 100)) || "N/A";
    const value = (id && id.slice(0, 100)) || "N/A";
    return {
      label,
      description,
      value,
    };
  });

  let updated = false;
  interaction.client.on(Events.InteractionCreate, async (i) => {
    if (!i.isStringSelectMenu()) return;

    const selected = i.values[0];

    if (
      dexData.data.data.find((id) => id.id == selected) != undefined &&
      !updated
    ) {
      updated = true;

      await i.deferUpdate().then(listChapters(interaction, selected));
    }
  });

  await interaction.editReply({
    embeds: [
      embedContents(interaction, title, embed_title, null, dexTitles, false),
    ],
    files: [ico],
    components: [menu_builder("Select Title", dexTitlesJSON)],
  });
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

// Get chapter data like thumbnail and title
async function getChapterData(chapterID) {
  // Fetch the chapter and manga data by chapterID
  const chapterData = await readChapterPrep(chapterID);
  const mangaData = await mangaInfo(chapterData.mangaID);

  // Get the thumbnail for the manga
  const cover_hash = mangaData.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );
  const coverData = await getCover(cover_hash.id);
  const cover_filename = coverData.data.data.attributes.fileName;
  const thumbnail = `https://uploads.mangadex.org/covers/${chapterData.mangaID}/${cover_filename}.256.jpg`;

  // Find the chapter that being selected
  let index = chapterData.chapters.findIndex(
    (chapter) => chapter.id === chapterID
  );
  const selectedChapter = chapterData.dexChapters[index];

  return {
    title: chapterData.mangaTitle,
    cover: thumbnail,
    chapter: selectedChapter,
  };
}

// Main function to download and zip a chapter
async function downloadChapter(interaction, chapterID) {
  try {
    const chapterInfo = await getChapterData(chapterID);

    // Create an embed to signalling the usert that the chapter is still being downloaded
    const embed = {
      color: 16741952,
      title: chapterInfo.title,
      thumbnail: {
        url: chapterInfo.cover,
      },
      author: {
        name: "Mangadex Downloader",
        icon_url: "attachment://mangadex_icon.png",
      },
      description: chapterInfo.chapter,
      fields: [
        {
          name: "Download link",
          value: "Downloading...",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed], files: [ico] });

    // Send POST request to process and zip the chapter
    const response = await axios.post(
      `http://yoshi.moe:3069/download/md/${chapterID}`
    );

    if (response.data.success) {
      // If zipping is successful, edit the reply with the download link
      embed.fields[0] = {
        name: "Download link",
        value: `[Download the chapter here!](http://yoshi.moe:3069/download/md/${chapterID}.zip)`,
      };

      await interaction.editReply({ embeds: [embed], files: [ico] });
    } else {
      // If zipping failed, edit the reply with an error message
      embed.fields[0] = {
        name: "Download link",
        value: `Error processing the chapter. Please try again later.`,
      };

      await interaction.editReply({ embeds: [embed], files: [ico] });
    }
  } catch (error) {
    console.error("Error processing the chapter:", error);
    await interaction.editReply(
      "Error processing the chapter. Please try again later."
    );
  }
}

// FETCH FUNCTION

async function getMangaFromChapter(id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/chapter/${id}`,
  });

  return resp.data.data.relationships.find((rel) => rel.type === "manga").id;
}

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

async function getLinkImage(chapterID) {
  const baseUrl = "https://api.mangadex.org";

  const resp = await axios({
    method: "GET",
    url: `${baseUrl}/at-home/server/${chapterID}`,
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

          const data = await readChapterPrep(id);
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
