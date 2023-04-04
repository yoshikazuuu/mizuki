const { createCollector } = require("../../utils/collector");
const { getMangaInfo, fetchCoverData } = require("./utils/api");
const { paginatedChapterSelector } = require("./utils/common");
const { ICO_MD } = require("../../utils/constants");
const { buildEmbed, info_buttons } = require("./utils/ui");

async function subCommandTitleInfo(interaction, title_id) {
  let readingStatus = false;
  const dexData = await getMangaInfo(title_id);
  const coverData = await fetchCoverData(dexData);

  const embed = buildEmbed(dexData, coverData, interaction, title_id);
  const btn = info_buttons(
    "Mangadex",
    `https://mangadex.org/title/${title_id}`
  );

  let m = await interaction.editReply({
    embeds: [embed],
    components: [btn],
    files: [ICO_MD],
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

module.exports = { subCommandTitleInfo };
