const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const axios = require("axios");
const { COMMAND_LOG } = require("../utils/log_template");

const TIMEOUT = 15000;
const NHENTAI_CUSTOM_ENDPOINT = "https://janda.mod.land/nhentai/get?book=";
const NHENTAI_RANDOM_ENDPOINT = "https://janda.mod.land/nhentai/random";
const ico = new AttachmentBuilder("assets/nhentai_icon.jpg");
const wrongUser = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

async function error(interaction, link, data) {
  console.log(link);
  console.log(data);
  console.log("========== ABOVE DATA CAUSING ERROR! ==========");
  await interaction.reply({
    embeds: [
      new EmbedBuilder().setColor("#F6C1CC").addFields({
        name: "Something's wrong with the API",
        value: `Try to open it manually using this link!`,
      }),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("nHentai")
          .setStyle(ButtonStyle.Link)
          .setURL(link)
      ),
    ],
  });
}

function buttons(page_number, data) {
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
      .setLabel(`${page_number + 1}/${data.data.image.length}`)
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

function buttons_disabled(page_number, data) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("first")
      .setEmoji("956179957359443988")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("prev")
      .setEmoji("956179957644685402")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("page_number")
      .setLabel(`${page_number + 1}/${data.data.image.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("next")
      .setEmoji("956179957464313876")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("last")
      .setEmoji("956179957531418655")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary)
  );
}

function embed_reader(interaction, page_number, data) {
  return new EmbedBuilder()
    .setColor(0xed2452)
    .setAuthor({
      name: "nHentai Reader",
      iconURL: "attachment://nhentai_icon.jpg",
    })
    .setDescription(`**Artist:** ${data.data.artist[0]}`)
    .setTitle(data.data.optional_title.english)
    .setURL(data.source)
    .setImage(data.data.image[page_number])
    .setTimestamp()
    .setFooter({
      text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
    });
}

async function nhreader(data, interaction) {
  let page_number = 0;

  const filter = (i) => {
    if (i.user.id === interaction.member.user.id) return true;
    return i.reply({ embeds: [wrongUser], ephemeral: true });
  };

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "next") {
      page_number += 1;
      if (page_number == data.data.image.length) {
        page_number = data.data.image.length - 1;
      }

      await i.update({
        embeds: [embed_reader(interaction, page_number, data)],
        components: [buttons(page_number, data)],
        files: [ico],
      });
    } else if (i.customId === "prev") {
      page_number -= 1;
      if (page_number == -1) {
        page_number = 0;
      }

      await i.update({
        embeds: [embed_reader(interaction, page_number, data)],
        components: [buttons(page_number, data)],
        files: [ico],
      });
    } else if (i.customId === "first") {
      page_number = 0;

      await i.update({
        embeds: [embed_reader(interaction, page_number, data)],
        components: [buttons(page_number, data)],
        files: [ico],
      });
    } else if (i.customId === "last") {
      page_number = data.data.image.length - 1;

      await i.update({
        embeds: [embed_reader(interaction, page_number, data)],
        components: [buttons(page_number, data)],
        files: [ico],
      });
    }
  });

  await interaction.reply({
    embeds: [embed_reader(interaction, page_number, data)],
    components: [buttons(page_number, data)],
    files: [ico],
  });

  setTimeout(() => {
    interaction.editReply({
      components: [buttons_disabled(page_number, data)],
    });
  }, TIMEOUT);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nhen")
    .setDescription("nHentai related commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("read")
        .setDescription("Read nHentai gallery.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("nHentai gallery code.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription("Read random nHentai gallery.")
    ),
  async execute(interaction) {
    if (!interaction.channel.nsfw) {
      // message was not sent in a NSFW channel
      await interaction.reply("NSFW channel please.");
      setTimeout(async () => {
        await interaction.deleteReply();
      }, 5000);
    }

    if (interaction.options.getSubcommand() === "read") {
      const galleryCode = interaction.options.getString("code");
      const { data } = await axios.get(NHENTAI_CUSTOM_ENDPOINT + galleryCode);
      const link = data.source;

      if (!data.data) {
        error(interaction, link, data);
        return;
      }

      COMMAND_LOG(interaction, `/read for ${data.data.optional_title.english}`);

      nhreader(data, interaction);
    } else if (interaction.options.getSubcommand() === "random") {
      const { data } = await axios.get(NHENTAI_RANDOM_ENDPOINT);
      const link = data.source;

      if (!data.success) {
        error(interaction, link, data);
        return;
      }

      COMMAND_LOG(interaction, `/read for ${data.data.optional_title.english}`);

      nhreader(data, interaction);
    }
  },
};
