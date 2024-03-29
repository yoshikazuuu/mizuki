const { subCommandChapterDownload } = require("./download");
const { getLinkImage, getDataFromChapter } = require("./utils/api");
const { embedMDReaderBuilder } = require("./utils/ui");
const { createCollector } = require("../../utils/collector");
const { ICO_MD } = require("../../utils/constants");
const { menuButtonsBuilder, downloadButton } = require("../../utils/ui");

async function readChapter(
  interaction,
  id,
  title_name,
  data_id,
  info_chapters
) {
  try {
    let pageNumber = 0;

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

    let buttonsEmbed = menuButtonsBuilder(pageNumber, dataJSON.image.length);
    let downloadBtn = downloadButton();
    let embed = embedMDReaderBuilder(interaction, pageNumber, dataJSON);
    let change_chapter = false;

    let m = await interaction.editReply({
      embeds: [embed],
      components: [buttonsEmbed, downloadBtn],
      files: [ICO_MD],
    });

    const collector = createCollector(m, interaction);
    collector.on("collect", async (i) => {
      collector.resetTimer();

      switch (i.customId) {
        case "next":
          pageNumber = Math.min(pageNumber + 1, dataJSON.image.length - 1);
          break;
        case "prev":
          pageNumber = Math.max(pageNumber - 1, 0);
          break;
        case "first": {
          index = Math.max(index - 1, 0);
          change_chapter = true;
          break;
        }
        case "last": {
          index = Math.min(index + 1, dataJSON.chapters_id.length - 1);
          change_chapter = true;
          break;
        }
        case "download":
          subCommandChapterDownload(interaction, dataJSON.id);
          break;
        default:
          break;
      }

      buttonsEmbed = menuButtonsBuilder(pageNumber, dataJSON.image.length);
      embed = embedMDReaderBuilder(interaction, pageNumber, dataJSON);

      if (change_chapter) {
        i.deferUpdate();
        collector.stop();
        return;
      }
      await i.update({
        embeds: [embed],
        components: [buttonsEmbed, downloadBtn],
        files: [ICO_MD],
      });
    });

    collector.on("end", async () => {
      if (!change_chapter) {
        for (let i = 0; i < buttonsEmbed.components.length; i++) {
          const btn = buttonsEmbed.components[i];
          btn.setDisabled(true);
        }
        downloadBtn.components[0].setDisabled(true);
        await m.edit({
          components: [buttonsEmbed, downloadBtn],
        });
      } else {
        await readChapter(
          interaction,
          dataJSON.chapters_id[index].id,
          title_name,
          data_id,
          info_chapters
        );
      }
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function subCommandChapterRead(interaction, id) {
  const data = await getDataFromChapter(id);
  await readChapter(
    interaction,
    data.chapterID,
    data.mangaTitle,
    data.chapters,
    data.dexChapters
  );
}

module.exports = { subCommandChapterRead, readChapter };
