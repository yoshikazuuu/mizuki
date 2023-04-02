const { Events } = require("discord.js");

const { createCollector } = require("../../../utils/collector");
const { readChapter } = require("../read");
const { getListChapters, getMangaTitleAndCover } = require("./api");
const { ICO_MD } = require("../../../utils/constants");
const { embedContents, buttons, menu_builder } = require("./ui");

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
    files: [ICO_MD],
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
    files: [ICO_MD],
  });
}

module.exports = { paginatedChapterSelector };
