const { AttachmentBuilder } = require("discord.js");

const MANGADEX_ENDPOINT = "https://api.mangadex.org";
const SAUCENAO_ENDPOINT = `https://saucenao.com/search.php`;
const NHENTAI_CUSTOM_ENDPOINT = "https://janda.sinkaroid.org/nhentai/get?book=";
const NHENTAI_RANDOM_ENDPOINT = "https://janda.sinkaroid.org/nhentai/random";
const ICO_MD = new AttachmentBuilder("assets/mangadex_icon.png");
const ICO_NH = new AttachmentBuilder("assets/nhentai_icon.jpg");
const ICO_AI = new AttachmentBuilder("assets/chatgpt_icon.png");
const TIMEOUT = 5 * 60 * 1000;
const COOLDOWNS = 15 * 1000;
const LLM_MODEL = "gpt-3.5-turbo";

module.exports = {
  MANGADEX_ENDPOINT,
  SAUCENAO_ENDPOINT,
  ICO_MD,
  ICO_NH,
  ICO_AI,
  TIMEOUT,
  LLM_MODEL,
  COOLDOWNS,
  NHENTAI_CUSTOM_ENDPOINT,
  NHENTAI_RANDOM_ENDPOINT,
};
