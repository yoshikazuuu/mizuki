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
const { username_md, password_md } = require("../../config.json");
const creds = {
  username: username_md,
  password: password_md,
};

const ico = new AttachmentBuilder("assets/mangadex_icon.png");
const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const TIMEOUT = 10 * 1000;
const wrongUser = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

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

async function readChapter(
  interaction,
  id,
  title_name,
  data_id,
  info_chapters
) {
  let page_number = 0;
  const dexData = await getLinkImage(id);
  const dataJSON = {
    id: id,
    title: title_name,
    source: `https://mangadex.org/chapter/${id}`,
    image: dexData,
    chapters_id: data_id,
    location: info_chapters,
  };
  let buttons_embed = buttons(page_number, dataJSON);

  // console.log(dataJSON);

  let m = await interaction.editReply({
    embeds: [embed_reader(interaction, page_number, dataJSON)],
    components: [buttons(page_number, dataJSON)],
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
    collector.resetTimer();

    switch (i.customId) {
      case "next":
        page_number = Math.min(page_number + 1, dataJSON.image.length - 1);
        break;
      case "prev":
        page_number = Math.max(page_number - 1, 0);
        break;
      case "first":
        page_number = 0;
        break;
      case "last":
        page_number = dataJSON.image.length - 1;
        break;
      default:
        break;
    }

    await i.update({
      embeds: [embed_reader(interaction, page_number, dataJSON)],
      components: [buttons(page_number, dataJSON)],
      files: [ico],
    });
  });

  collector.on("end", async () => {
    for (let i = 0; i < buttons_embed.components.length; i++) {
      const btn = buttons_embed.components[i];
      btn.setDisabled(true);
    }
    await m.edit({
      components: [buttons(page_number, dataJSON)],
    });
  });
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

  const manga_title = dexTitle.data.data.attributes.title.en;
  const coverData = await getCover(cover_hash.id);
  const cover_filename = coverData.data.data.attributes.fileName;
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

// (async () => {
//   const resp = await axios({
//     method: "POST",
//     url: `${MANGADEX_ENDPOINT}/auth/login`,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     data: creds,
//   });
//   refreshToken = resp.data.token.refresh;
// })();

// setInterval(async () => {
//   axios({
//     method: "POST",
//     url: `${MANGADEX_ENDPOINT}/auth/refresh`,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     data: {
//       token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ0eXAiOiJyZWZyZXNoIiwiaXNzIjoibWFuZ2FkZXgub3JnIiwiYXVkIjoibWFuZ2FkZXgub3JnIiwiaWF0IjoxNjc3ODY4NzI1LCJuYmYiOjE2Nzc4Njg3MjUsImV4cCI6MTY4MDQ2MDcyNSwidWlkIjoiMWU1ZWUxY2UtMWRhYi00NzE4LTllOWYtZjI0MmQwZDIxODg2Iiwic2lkIjoiNDllNzlmZmUtMjEzZC00ZGEzLWJlODQtMzM4MGRjMzljOTk3In0.Hpe3U0XAcSufJZ5INtTsIH5ElRnrNX0s42PS_0qacbDyKTa-AnFDKIVgnjmkm4zz7jHdIdbUkU1FZx__iTrxj66rByaonljpcVLvyhLjlPnI8dIBRjoLLEZ6_IYtMUDzsS8B8wLgswkQ9IN1oV1OdHN4Y4ZGnVNv3XHN2ORAEwTZ29liMN1lIz3MPzu94MgRW8PWnxqWC0Ou98fd1lYh1Jy7o1dyisd5v-3Iq7GYgUT9bG14ScBX7wzfeRvK-OkfyA8AR2tN8p605NUUrdh-CS6x9Waz4nEmBlb6Ops4BNdRAPyApDZsJxWaEIIL7Qchgn--bApXflefkmexPtbB_JMu18ajbXbJ3DD2EowiGxkS5demlOTq8ZXfsM9QchUQehcT7ms015cCl4HGxosDweETP5zrEAcwbNLQuu8O3CoGwnK5wFRYL5nzxZZ76lPOglFPq6DFhYgoLUwZhpxUwHJvS8Vs2od2NnDaSyP3oi3aQq0-he2rvGo6jpJbZMb346xRb88hVZOqChqD-bNWT0BIB3xVZlmxWu7BOGu7zGsb8P7dakY3C-oP29WolRLTUhsDDqJeWTblLThnphgUnrJIhs5q483o3dfmJskIGbpWNLD-Cxm4aYRZUvTVEQwB7QtFndEhqMosJM-Zdb15UoHAlxQ_X5on5uG-_Zxh5p4`,
//     },
//   });
// }, 15 * 60 * 1000);

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

async function getLinkImage(chapter_id) {
  const resp = await axios({
    method: "GET",
    url: `https://api.mangadex.org/at-home/server/${chapter_id}`,
  });
  const mappedLink = resp.data.chapter.data.map((img) => {
    const link = `${resp.data.baseUrl}/data/${resp.data.chapter.hash}/${img}`;
    return link;
  });

  return mappedLink;
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
