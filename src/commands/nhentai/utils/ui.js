const { EmbedBuilder } = require("@discordjs/builders");

function embedNHReaderBuilder(interaction, page_number, data) {
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

function embedInfoBuilder(interaction, data) {
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

const embedNSFW = new EmbedBuilder()
  .setColor(16178444)
  .setTitle("NSFW Channel please... *nii-sama!*")
  .setDescription("Please don't make other people uncomfortable.");

module.exports = {
  embedNHReaderBuilder,
  embedInfoBuilder,
  embedNSFW,
};
