const { embedNHReaderBuilder } = require("./utils/ui");
const { createCollector } = require("../../utils/collector");
const { ICO_NH } = require("../../utils/constants");
const { menuButtonsBuilder } = require("../../utils/ui");

async function nhenReader(data, interaction, info) {
  try {
    let m = null;
    let page_number = 0;
    let buttons_embed = menuButtonsBuilder(page_number, data.data.image.length);

    // Check if it comes from info command or not
    if (info) {
      m = await interaction.editReply({
        embeds: [embedNHReaderBuilder(interaction, page_number, data)],
        components: [buttons_embed],
        files: [ICO_NH],
      });
    } else {
      m = await interaction.followUp({
        embeds: [embedNHReaderBuilder(interaction, page_number, data)],
        components: [buttons_embed],
        files: [ICO_NH],
      });
    }

    // Create a collector
    const collector = createCollector(m, interaction);

    collector.on("collect", async (i) => {
      collector.resetTimer();

      switch (i.customId) {
        case "next":
          page_number = Math.min(page_number + 1, data.data.image.length - 1);
          break;
        case "prev":
          page_number = Math.max(page_number - 1, 0);
          break;
        case "first":
          page_number = 0;
          break;
        case "last":
          page_number = data.data.image.length - 1;
          break;
        default:
          break;
      }

      buttons_embed = menuButtonsBuilder(page_number, data.data.image.length);

      await i.update({
        embeds: [embedNHReaderBuilder(interaction, page_number, data)],
        components: [buttons_embed],
        files: [ICO_NH],
      });
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
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { nhenReader };
