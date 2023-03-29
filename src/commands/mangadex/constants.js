const { AttachmentBuilder, EmbedBuilder } = require("discord.js");

const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const ICO = new AttachmentBuilder("assets/mangadex_icon.png");
const TIMEOUT = 60 * 1000;
const WRONGUSER = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

module.exports = { MANGADEX_ENDPOINT, ICO, TIMEOUT, WRONGUSER };
