const { Events } = require("discord.js");
const { searchManga, mapDexDataToJSON } = require("./utils/api");
const { ICO_MD } = require("../../utils/constants");
const { buildSearchEmbed, menuSelectBuilder } = require("./utils/ui");
const { subCommandTitleInfo } = require("./info");

// This code is used to search for titles and returns the data of the titles that match the search query
async function subCommandTitleSearch(interaction, title) {
  try {
    const dexData = await searchManga(title);
    const embed_title = `Results of: ${title}`;

    // Menu collector
    let updated = false;
    interaction.client.on(Events.InteractionCreate, async (i) => {
      if (!i.isStringSelectMenu()) return;

      const selected = i.values[0];
      if (
        dexData.data.data.find((id) => id.id == selected) != undefined &&
        !updated
      ) {
        updated = true;
        i.deferUpdate().then(subCommandTitleInfo(interaction, selected));
      }
    });

    // Format the data to JSON and embed it
    const titlesJSON = mapDexDataToJSON(dexData);
    const searchEmbed = buildSearchEmbed(
      interaction,
      title,
      embed_title,
      titlesJSON
    );

    // Check if the search returns null
    let menu;
    if (titlesJSON.length > 0) {
      menu = menuSelectBuilder("Select Title", titlesJSON);
    }

    await interaction.editReply({
      embeds: [searchEmbed],
      files: [ICO_MD],
      components: menu ? [menu] : [],
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = { subCommandTitleSearch };
