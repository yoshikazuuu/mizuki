const { AttachmentBuilder, EmbedBuilder } = require("discord.js");

const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const NHENTAI_CUSTOM_ENDPOINT = "https://janda.sinkaroid.org/nhentai/get?book=";
const NHENTAI_RANDOM_ENDPOINT = "https://janda.sinkaroid.org/nhentai/random";
const ICO_MD = new AttachmentBuilder("assets/mangadex_icon.png");
const ICO_NH = new AttachmentBuilder("assets/nhentai_icon.jpg");
const TIMEOUT = 60 * 1000;
const COOLDOWNS = 15 * 1000;
const LLM_MODEL = "gpt-3.5-turbo";
const WRONGUSER = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

module.exports = {
  MANGADEX_ENDPOINT,
  ICO_MD,
  ICO_NH,
  TIMEOUT,
  LLM_MODEL,
  WRONGUSER,
  COOLDOWNS,
  NHENTAI_CUSTOM_ENDPOINT,
  NHENTAI_RANDOM_ENDPOINT,
};
