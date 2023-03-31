// const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
// const { ERROR_LOG } = require("../utils/logger");
// const fs = require("fs");

// async function confessConfig(interaction, method, channel) {
//   const guildID = interaction.guildId;
//   const channelID = channel.id;
//   const embed = {
//     color: 0xf6c1cc,
//     title: `Confession channels for ${interaction.guild.name}`,
//     fields: [],
//     timestamp: new Date().toISOString(),
//   };

//   switch (method) {
//     case "add": {
//       // Check if the config file already exists
//       if (fs.existsSync("configs/config_confess.json")) {
//         // Load the existing config file
//         const configData = JSON.parse(
//           fs.readFileSync("configs/config_confess.json")
//         );

//         // Check if the guild already has the channel in its allowed channels
//         if (configData[guildID] && configData[guildID].includes(channelID)) {
//           embed.fields[0] = {
//             name: `Operation`,
//             value:
//               "This channel is already a confession channel for this guild.",
//           };
//           break;
//         }

//         // Add the new channel to the guild's allowed channels
//         if (configData[guildID]) {
//           configData[guildID].push(channelID);
//         } else {
//           configData[guildID] = [channelID];
//         }

//         // Save the updated config file
//         fs.writeFileSync(
//           "configs/config_confess.json",
//           JSON.stringify(configData, null, 2)
//         );

//         embed.fields[0] = {
//           name: `Operation`,
//           value: `Confession channel added for <#${channelID}>`,
//         };
//       } else {
//         // Create a new config file with the guild's allowed channel
//         const configData = { [guildID]: [channelID] };

//         // Save the new config file
//         fs.writeFileSync(
//           "configs/config_confess.json",
//           JSON.stringify(configData, null, 2)
//         );

//         embed.fields[0] = {
//           name: `Operation`,
//           value: `Confession channel added for <#${channelID}>`,
//         };
//       }

//       break;
//     }
//     case "remove": {
//       // Check if the config file exists
//       if (!fs.existsSync("configs/config_confess.json")) {
//         embed.fields[0] = {
//           name: `Operation`,
//           value: "No confession channels configured.",
//         };
//         break;
//       }

//       // Load the existing config file
//       const configData = JSON.parse(
//         fs.readFileSync("configs/config_confess.json")
//       );

//       // Check if the guild has the channel in its allowed channels
//       if (!configData[guildID] || !configData[guildID].includes(channelID)) {
//         embed.fields[0] = {
//           name: `Operation`,
//           value: "This channel is not a confession channel for this guild.",
//         };
//         break;
//       }

//       // Remove the channel from the guild's allowed channels
//       configData[guildID] = configData[guildID].filter(
//         (id) => id !== channelID
//       );

//       // If the guild has no more allowed channels, remove the guild from the config file
//       if (configData[guildID].length === 0) {
//         delete configData[guildID];
//       }

//       // Save the updated config file
//       fs.writeFileSync(
//         "configs/config_confess.json",
//         JSON.stringify(configData, null, 2)
//       );

//       embed.fields[0] = {
//         name: `Operation`,
//         value: `Confession channel removed for <#${channelID}>`,
//       };
//       break;
//     }

//     default:
//       embed.fields[0] = {
//         name: `Operation`,
//         value: 'Invalid method. Use "add" or "remove".',
//       };
//       break;
//   }

//   // Check if the config file exists
//   if (!fs.existsSync("configs/config_confess.json")) {
//     interaction.editReply("No confession channels configured.");
//     return;
//   }

//   // Load the existing config file
//   const configData = JSON.parse(fs.readFileSync("configs/config_confess.json"));

//   // Check if the guild has any allowed channels
//   if (!configData[guildID] || configData[guildID].length === 0) {
//     interaction.editReply("No confession channels configured for this server.");
//     return;
//   }

//   // Get the channel objects for each allowed channel ID
//   const allowedChannels = configData[guildID]
//     .map((channelID) => interaction.guild.channels.cache.get(channelID))
//     .filter((channel) => channel);

//   // Check if any of the allowed channels no longer exist
//   if (allowedChannels.length < configData[guildID].length) {
//     // Update the config file to remove the non-existent channels
//     configData[guildID] = allowedChannels.map((channel) => channel.id);
//     fs.writeFileSync(
//       "configs/config_confess.json",
//       JSON.stringify(configData, null, 2)
//     );
//   }

//   // Create an embed with the list of allowed channels
//   embed.fields[1] = {
//     name: `Allowed Channels`,
//     value: allowedChannels.map((channel) => `<#${channel.id}>`).join("\n"),
//   };

//   await interaction.editReply({ embeds: [embed] });
// }

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("config")
//     .setDescription("Configuration for certain commands.")
//     .addSubcommand((subcommand) =>
//       subcommand
//         .setName("confess")
//         .setDescription("Set-up for allowed channel to use confess.")
//         .addStringOption((option) =>
//           option
//             .setName("method")
//             .setDescription("Add or Remove channel.")
//             .setRequired(true)
//             .addChoices(
//               { name: "add", value: "add" },
//               { name: "remove", value: "remove" }
//             )
//         )
//         .addChannelOption((option) =>
//           option
//             .setName("channel")
//             .setDescription("Allowed channel to send confess.")
//             .setRequired(true)
//         )
//     ),

//   async execute(interaction) {
//     try {
//       // Check if user had admin role
//       const adminPermissions = new PermissionsBitField(
//         PermissionsBitField.Flags.Administrator
//       );
//       if (!interaction.member.permissions.has(adminPermissions)) {
//         await interaction.reply({
//           embeds: [
//             {
//               color: 0xf6c1cc,
//               description: "You don't have an admin permission, *nii-sama!*",
//             },
//           ],
//           ephemeral: true,
//         });
//         return;
//       }

//       // Deferring the reply to wait the rest of the program
//       await interaction.deferReply({ ephemeral: false });

//       // Swtich case to handle every subcommand
//       switch (interaction.options.getSubcommand()) {
//         case "confess": {
//           const method = interaction.options.getString("method");
//           const channel = interaction.options.getChannel("channel");

//           confessConfig(interaction, method, channel);
//           break;
//         }

//         default:
//           break;
//       }
//     } catch (err) {
//       ERROR_LOG(err);
//       console.error(err);
//     }
//   },
// };
