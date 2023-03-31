const axios = require("axios");
const { ICO } = require("./constants");
const { getCover, getMangaInfo, getDataFromChapter } = require("./api");

// Get chapter data like thumbnail and title
async function getChapterData(chapterID) {
  // Fetch the chapter and manga data by chapterID
  const chapterData = await getDataFromChapter(chapterID);
  const mangaData = await getMangaInfo(chapterData.mangaID);

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
  let embed;
  try {
    // Fetch the data of the chapter
    const chapterInfo = await getChapterData(chapterID);

    // Create an embed to signalling the usert that the chapter is still being downloaded
    embed = {
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
          value: "⚠️ - Downloading...",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed], files: [ICO] });

    // Send POST request to process and zip the chapter
    const response = await axios({
      method: "POST",
      url: `https://yoshi.moe/download/md/${chapterID}`,
      timeout: 1000 * 60 * 14,
    });

    if (response.data.success) {
      // If zipping is successful, edit the reply with the download link
      embed.fields[0] = {
        name: "Download link",
        value: `✅ - [**Download the chapter here!**](https://yoshi.moe/download/md/${chapterID}.zip) \n You have *5 minutes* before the file expired.`,
      };

      await interaction.editReply({ embeds: [embed], files: [ICO] });
    } else {
      // If zipping failed, edit the reply with an error message
      embed.fields[0] = {
        name: "Download link",
        value: `Error processing the chapter. Please try again later.`,
      };

      await interaction.editReply({ embeds: [embed], files: [ICO] });
    }
  } catch (error) {
    console.error("Error processing the chapter:", error);
    embed = {
      color: 16741952,
      author: {
        name: "Mangadex Downloader",
        icon_url: "attachment://mangadex_icon.png",
      },
      fields: [
        {
          name: "Download link",
          value: `Error processing the chapter. Please try again later.`,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed], files: [ICO] });
  }
}

module.exports = downloadChapter;
