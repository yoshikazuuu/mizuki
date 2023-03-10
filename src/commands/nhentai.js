const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const axios = require("axios");
const { COMMAND_LOG, ERROR_LOG } = require("../utils/log_template");

const TIMEOUT = 60 * 1000;
const COOLDOWNS = 10 * 1000;
const NHENTAI_CUSTOM_ENDPOINT = "https://janda.mod.land/nhentai/get?book=";
const NHENTAI_RANDOM_ENDPOINT = "https://janda.mod.land/nhentai/random";

const cooldowns = new Map();
const ico = new AttachmentBuilder("assets/nhentai_icon.jpg");
const wrongUser = new EmbedBuilder().setColor("#F6C1CC").addFields({
  name: "You Really Thought Huh?",
  value: `Only the one who activated this command can click a button`,
});

function cooldownEmbed(remainingTime) {
  return new EmbedBuilder().setColor("#F6C1CC").addFields({
    name: "Take it slow *nii-sama!*",
    value: `:exclamation: You can use it again in **${remainingTime / 1000}s**`,
  });
}

async function errorResponse(interaction, galleryCode, error) {
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("#F6C1CC")
        .setTitle(`(Status ${error.response.status})`)
        .addFields({
          name: `Something's wrong with the API`,
          value: `Try again or open it manually using this link.`,
        }),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("nHentai")
          .setStyle(ButtonStyle.Link)
          .setURL(
            galleryCode
              ? `https://nhentai.net/g/${galleryCode}`
              : `https://nhentai.net/random`
          )
      ),
    ],
  });
}

function info_buttons(title_link, source) {
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

function embed_reader(interaction, page_number, data) {
  return new EmbedBuilder()
    .setColor(0xed2452)
    .setAuthor({
      name: "nHentai Reader",
      iconURL: "attachment://nhentai_icon.jpg",
    })
    .setDescription(`**Artist:** ${data.data.artist.join(", ")}`)
    .setTitle(data.data.optional_title.pretty)
    .setURL(data.source)
    .setImage(data.data.image[page_number])
    .setTimestamp()
    .setFooter({
      text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
    });
}

function embed_info(interaction, data) {
  return new EmbedBuilder()
    .setColor(0xed2452)
    .setAuthor({
      name: "Details",
      iconURL: "attachment://nhentai_icon.jpg",
    })
    .setTitle(data.data.optional_title.pretty)
    .addFields(
      {
        name: `Tags`,
        value: `${
          Array.isArray(data.data.tags) && data.data.tags.length
            ? data.data.tags.join(", ")
            : "N/A"
        }`,
      },
      {
        name: `Language`,
        value: `${
          Array.isArray(data.data.language) && data.data.language.length
            ? data.data.language.join(", ")
            : "N/A"
        }`,
      },
      {
        name: `Pages`,
        value: `${data.data.total.length ? data.data.total : "N/A"}`,
        inline: true,
      },
      {
        name: `Favorites`,
        value: `${
          data.data.num_favorites.length ? data.data.num_favorites : "N/A"
        }`,
        inline: true,
      },
      {
        name: `Parodies`,
        value: `${
          Array.isArray(data.data.parodies) && data.data.parodies.length
            ? data.data.parodies.join(", ")
            : "N/A"
        }`,
        inline: true,
      },
      {
        name: `Artists`,
        value: `${
          Array.isArray(data.data.artist) && data.data.artist.length
            ? data.data.artist.join(", ")
            : "N/A"
        }`,
        inline: true,
      },
      {
        name: `Group`,
        value: `${
          Array.isArray(data.data.group) && data.data.group.length
            ? data.data.group.join(", ")
            : "N/A"
        }`,
        inline: true,
      },
      {
        name: `Characters`,
        value: `${
          Array.isArray(data.data.characters) && data.data.characters.length
            ? data.data.characters.join(", ")
            : "N/A"
        }`,
        inline: true,
      }
    )
    .setURL(data.source)
    .setImage(data.data.image[0])
    .setTimestamp()
    .setFooter({
      text: `Requested by ${interaction.user.username}#${interaction.user.discriminator}`,
    });
}

async function nhinfo(data, interaction) {
  let readingStatus = false;
  const buttons = info_buttons("nHentai", data.source);

  let m = await interaction.followUp({
    embeds: [embed_info(interaction, data)],
    components: [buttons],
    files: [ico],
  });

  const filter = (button) => {
    if (button.user.id !== interaction.member.user.id) {
      button.reply({ embeds: [wrongUser], ephemeral: true });
      return false;
    }
    return true;
  };

  const collector = m.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "read") {
      readingStatus = true;
      await i.update({
        embeds: [embed_info(interaction, data)],
        components: [buttons],
        files: [ico],
      });
      collector.stop();
      return;
    }
  });

  collector.on("end", async () => {
    if (readingStatus) {
      await nhreader(data, interaction, true);
    } else {
      buttons.components[0].setDisabled(true);
      await m.edit({
        components: [buttons],
      });
    }
  });
}

async function nhreader(data, interaction, info) {
  let m = null;
  let page_number = 0;
  let buttons_embed = buttons(page_number, data);

  if (info) {
    m = await interaction.editReply({
      embeds: [embed_reader(interaction, page_number, data)],
      components: [buttons_embed],
      files: [ico],
    });
  } else {
    m = await interaction.followUp({
      embeds: [embed_reader(interaction, page_number, data)],
      components: [buttons_embed],
      files: [ico],
    });
  }

  const filter = (button) => {
    if (button.user.id !== interaction.member.user.id) {
      button.reply({ embeds: [wrongUser], ephemeral: true });
      return false;
    }
    return true;
  };

  const collector = m.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });

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

    buttons_embed = buttons(page_number, data);

    await i.update({
      embeds: [embed_reader(interaction, page_number, data)],
      components: [buttons_embed],
      files: [ico],
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Get info about nHentai gallery.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("nHentai gallery code.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const galleryCode = interaction.options.getString("code");

    try {
      if (!interaction.channel.nsfw) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor("#F6C1CC").addFields({
              name: "NSFW Channel please... *nii-sama!*",
              value: `Please don't make other people uncomfortable.`,
            }),
          ],
          ephemeral: true,
        });
      }

      const { id } = interaction.member.user;
      if (cooldowns.has(id)) {
        const cooldown = cooldowns.get(id);
        const remainingTime = cooldown - interaction.createdTimestamp;
        if (remainingTime > 0) {
          return interaction.reply({
            embeds: [cooldownEmbed(remainingTime)],
            ephemeral: true,
          });
        }
      }
      const messageCreated = await interaction.deferReply({ fetchReply: true });

      const { data } = await axios.get(
        galleryCode
          ? NHENTAI_CUSTOM_ENDPOINT + galleryCode
          : NHENTAI_RANDOM_ENDPOINT
      );

      cooldowns.set(id, messageCreated.createdTimestamp + COOLDOWNS);

      switch (interaction.options.getSubcommand()) {
        case "read":
          COMMAND_LOG(
            interaction,
            `/read for ${data.data.optional_title.pretty}`
          );

          nhreader(data, interaction, false);
          break;
        case "random":
          COMMAND_LOG(
            interaction,
            `/random for ${data.data.optional_title.pretty}`
          );

          nhinfo(data, interaction);
          break;
        case "info":
          COMMAND_LOG(
            interaction,
            `/info for ${data.data.optional_title.pretty}`
          );

          nhinfo(data, interaction);
          break;
        default:
          break;
      }

      setTimeout(() => cooldowns.delete(id), COOLDOWNS);
    } catch (error) {
      if (
        error.response &&
        (error.response.status >= 400 || error.response.status <= 499)
      ) {
        ERROR_LOG(error);
        errorResponse(interaction, galleryCode, error);
      } else {
        ERROR_LOG(error);
      }
    }
  },
};
