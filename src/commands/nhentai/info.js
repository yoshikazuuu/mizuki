const { nhenReader } = require("./reader");
const { embedInfoBuilder } = require("./utils/ui");
const { createCollector } = require("../../utils/collector");
const { ICO_NH } = require("../../utils/constants");
const { menuInfoBuilder } = require("../../utils/ui");

async function nhenInfo(data, interaction) {
  let readingStatus = false;
  const buttons = menuInfoBuilder("nHentai", data.source);

  let m = await interaction.followUp({
    embeds: [embedInfoBuilder(interaction, data)],
    components: [buttons],
    files: [ICO_NH],
  });

  // Create a collector
  const collector = createCollector(m, interaction);

  collector.on("collect", async (i) => {
    if (i.customId === "read") {
      readingStatus = true;
      await i.update({
        embeds: [embedInfoBuilder(interaction, data)],
        components: [buttons],
        files: [ICO_NH],
      });
      collector.stop();
      return;
    }
  });

  collector.on("end", async () => {
    if (readingStatus) {
      await nhenReader(data, interaction, true);
    } else {
      buttons.components[0].setDisabled(true);
      await m.edit({
        components: [buttons],
      });
    }
  });
}

module.exports = { nhenInfo };
