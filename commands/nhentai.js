const { API } = require("nhentai-api");
const { SlashCommandBuilder } = require("discord.js");

const api = new API();
api.getBook(177013).then((book) => {
  api.getImageURL(book.cover); // https://t.nhentai.net/galleries/987560/cover.jpg
  api.getImageURL(book.pages[1]); // https://i.nhentai.net/galleries/987560/2.jpg
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nhen")
    .setDescription("Read nhentai with ease."),
  async execute(interaction) {
    await api.getBook(177013).then((book) => {
      interaction.reply(api.getImageURL(book.cover)); // https://t.nhentai.net/galleries/987560/cover.jpg
      interaction.reply(book.pages[1]); // https://i.nhentai.net/galleries/987560/2.jpg
    });
  },
};
