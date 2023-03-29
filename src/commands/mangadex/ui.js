const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

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

function buttons(page_number, length) {
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
      .setLabel(`${page_number + 1}/${length}`)
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

function extractTags(md, group) {
  return md.attributes.tags
    .filter((tag) => tag.attributes.group === group)
    .map((tag) => tag.attributes.name.en)
    .join(", ");
}

function buildEmbed(dexData, coverData, interaction, title_id) {
  const md = dexData.data.data;
  const source = `https://mangadex.org/title/${md.id}`;
  const cover_filename = coverData.data.data.attributes.fileName;
  const format = extractTags(md, "format");
  const genres = extractTags(md, "genre");

  return new EmbedBuilder()
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
}

function buildSearchEmbed(interaction, title, embed_title, dexTitlesJSON) {
  const dexTitles = dexTitlesJSON
    .map(
      (entry, index) =>
        `**${index + 1}. ${entry.label}**\n*ID: ${entry.value}*\n`
    )
    .join("\n");

  return embedContents(interaction, title, embed_title, null, dexTitles, false);
}

module.exports = {
  buildSearchEmbed,
  info_buttons,
  buttons,
  embed_reader,
  embedContents,
  menu_builder,
  buildEmbed,
};
