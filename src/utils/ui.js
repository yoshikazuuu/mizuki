const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function cooldownEmbed(remainingTime) {
  return new EmbedBuilder().setColor("#F6C1CC").addFields({
    name: "Take it slow *nii-sama!*",
    value: `:exclamation: You can use it again in **${remainingTime / 1000}s**`,
  });
}

function menuInfoBuilder(title_link, source) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("read")
      .setEmoji("📖")
      .setLabel("Read")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel(title_link)
      .setStyle(ButtonStyle.Link)
      .setURL(source)
  );
}

function menuButtonsBuilder(page_number, length) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("first")
      .setEmoji("956179957359443988")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("prev")
      .setEmoji("956179957644685402")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("page_number")
      .setLabel(`${page_number + 1}/${length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("next")
      .setEmoji("956179957464313876")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("last")
      .setEmoji("956179957531418655")
      .setStyle(ButtonStyle.Primary)
  );
}

const wrongUser = new EmbedBuilder()
  .setColor(16171468)
  .setTitle("You Really Thought Huh?")
  .setDescription(
    "Only the one who activated this command can click the button."
  );

function downloadButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("download")
      .setLabel("Download Chapter")
      .setStyle(ButtonStyle.Success)
  );
}

module.exports = {
  wrongUser,
  downloadButton,
  cooldownEmbed,
  menuInfoBuilder,
  menuButtonsBuilder,
};
