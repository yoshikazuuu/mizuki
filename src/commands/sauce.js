const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");
const { saucenao } = require("../../config.json");
const { default: axios } = require("axios");

const SAUCENAO_ENDPOINT = `https://saucenao.com/search.php`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sauce")
    .setDescription("Get the hot sauce.")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription(
          "Url from the image. (just upload it first then copy the link [more compatibility on-progress])"
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Get the url from the command
      const url = interaction.options.getString("url");

      // Fetch the data from SauceNAO
      const resp = await axios({
        method: "GET",
        url: SAUCENAO_ENDPOINT,
        params: {
          db: "999",
          testmode: "1",
          output_type: "2",
          numres: "5",
          api_key: saucenao,
          url: url,
        },
      });

      // Determine which index that needed to show the data (to be)
      // switch (resp.data.results[0].header.index_id) {
      //   default:
      //     break;
      // }

      // Temp index
      let indexInfo = `**Similarity: **${resp.data.results[0].header.similarity}\n**Index: ** ${resp.data.results[0].header.index_name}\n`;
      if (
        Object.prototype.hasOwnProperty.call(
          resp.data.results[0].data,
          "ext_urls"
        )
      ) {
        // ext_urls property exists in the data object
        indexInfo += `**Source: \n**${resp.data.results[0].data.ext_urls[0]}`;
      } else {
        // ext_urls property does not exist in the data object
        indexInfo += `**Source: **${
          resp.data.results[0].data.source
            ? resp.data.results[0].data.source
            : `(nothing to be linked (on-progress))`
        }`;
      }

      // Create the embed
      const embed = new EmbedBuilder()
        .setColor("#F6C1CC")
        .setTitle("Sauce Finder")
        .setThumbnail(resp.data.results[0].header.thumbnail)
        .setDescription(indexInfo);

      // Send message
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
