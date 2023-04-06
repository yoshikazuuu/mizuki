const axios = require("axios");
const { ICO_NH } = require("../../utils/constants");

async function nhenDownloader(interaction, data) {
  let embed;
  try {
    // Create an embed to signalling the usert that the chapter is still being downloaded
    embed = {
      color: 16741952,
      title: data.data.title,
      thumbnail: {
        url: data.data.image[0],
      },
      author: {
        name: "nHentai Downloader",
        icon_url: "attachment://nhentai_icon.jpg",
      },
      description: `ID: #${data.data.id}`,
      fields: [
        {
          name: "Download link",
          value: "⚠️ - Downloading...",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed], files: [ICO_NH] });

    // Send POST request to process and zip the chapter
    const response = await axios({
      method: "POST",
      url: `https://yoshi.moe/download/md/${data.data.id}`,
      timeout: 1000 * 60 * 14,
    });

    if (response.data.success) {
      // If zipping is successful, edit the reply with the download link
      embed.fields[0] = {
        name: "Download link",
        value: `✅ - [**Download the chapter here!**](https://yoshi.moe/download/nhen/${data.data.id}.zip) \n You have *5 minutes* before the file expired.`,
      };

      await interaction.editReply({ embeds: [embed], files: [ICO_NH] });
    } else {
      // If zipping failed, edit the reply with an error message
      embed.fields[0] = {
        name: "Download link",
        value: `Error processing the chapter. Please try again later.`,
      };

      await interaction.editReply({ embeds: [embed], files: [ICO_NH] });
    }
  } catch (error) {
    console.error("Error processing the chapter:", error);
    embed.fields[0] = {
      name: "Download link",
      value: `Error processing the chapter. Please try again later.`,
    };

    await interaction.editReply({ embeds: [embed], files: [ICO_NH] });
  }
}

module.exports = { nhenDownloader };
