// const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
// const { ERROR_LOG, COMMAND_LOG } = require("../utils/logger");
// const axios = require("axios");
// const fs = require("fs");

// // Load the env variables
// const dotenv = require("dotenv");
// dotenv.config();
// const giphy_token = process.env.GIPHY_TOKEN;

// const GIPHY_ENDPOINT = `https://api.giphy.com/v1/gifs/random?api_key=${giphy_token}&tag=fbi+agents%2C+fugitive%2C+fbi+agent&rating=g`;

// function getPeodList(serverId) {
//   const filePath = "configs/caught_users.json";
//   if (!fs.existsSync(filePath)) {
//     return null;
//   }

//   const caughtUsers = JSON.parse(fs.readFileSync(filePath));

//   const userList = Object.keys(caughtUsers)
//     .map((id) => caughtUsers[id])
//     .filter((user) =>
//       Object.prototype.hasOwnProperty.call(user.servers, serverId)
//     )
//     .map((user) => {
//       return {
//         username: user.username,
//         count: user.servers[serverId],
//       };
//     });

//   // Sort the userList array by count in descending order
//   userList.sort((a, b) => b.count - a.count);

//   return userList;
// }

// function addPeodList(id, username, serverId) {
//   const filePath = "configs/caught_users.json";
//   let caughtUsers = {};
//   if (fs.existsSync(filePath)) {
//     caughtUsers = JSON.parse(fs.readFileSync(filePath));
//   }
//   if (!caughtUsers[id]) {
//     caughtUsers[id] = {
//       username: username,
//       servers: {
//         [serverId]: 1,
//       },
//     };
//   } else {
//     if (!caughtUsers[id].servers[serverId]) {
//       caughtUsers[id].servers[serverId] = 1;
//     } else {
//       caughtUsers[id].servers[serverId] += 1;
//     }
//   }
//   const transformedData = {};
//   transformedData[id] = {
//     username: caughtUsers[id].username,
//     servers: caughtUsers[id].servers,
//   };
//   const updatedData = Object.assign({}, caughtUsers, transformedData);
//   fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
// }

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("peod")
//     .setDescription("Catch a pedo.")
//     .addSubcommand((subcommand) =>
//       subcommand.setName("list").setDescription("Show peod lists.")
//     )
//     .addSubcommand((subcommand) =>
//       subcommand
//         .setName("catch")
//         .setDescription("Catch the peod user.")
//         .addUserOption((option) =>
//           option
//             .setName("user")
//             .setDescription("Tag the peod.")
//             .setRequired(true)
//         )
//     ),
//   async execute(interaction) {
//     try {
//       await interaction.deferReply();
//       const serverId = interaction.guildId;

//       if (interaction.options.getSubcommand() === "catch") {
//         COMMAND_LOG(interaction, "/catch");
//         const id = interaction.options.getUser("user");

//         const username = `${id.username}#${id.discriminator}`;

//         // Get the GIF using the ENDPOINT
//         const { data } = await axios({
//           method: "GET",
//           url: GIPHY_ENDPOINT,
//         });
//         const gif = data.data.images.fixed_height.url;
//         const embed = new EmbedBuilder()
//           .setColor(`#F6C1CC`)
//           .setTitle(`${username} has been caught!`)
//           .setImage(gif)
//           .setTimestamp();

//         // Add the caught user to the list and increment their count
//         addPeodList(id, username, serverId);

//         // Post the message in the channel
//         await interaction.editReply({ embeds: [embed] });

//         // Send the message to the user
//         const serverName = interaction.guild.name;
//         const user = await interaction.client.users.fetch(id);
//         embed.setTitle(`You have been caught in ${serverName}!`);
//         await user.send({ embeds: [embed] });
//       } else if (interaction.options.getSubcommand() === "list") {
//         COMMAND_LOG(interaction, "/list");

//         // Get the lists
//         const lists = getPeodList(serverId);

//         // Embed JSON initialization
//         const embed = {
//           title: "[FBI Reports] Peod Lists",
//           color: 16173260,
//           fields: [],
//         };

//         // Validate the lists
//         if (!lists) {
//           embed.fields[0] = {
//             name: `No peod catched.`,
//             value: `Try to use /peod catch to fill this list!`,
//           };
//           await interaction.editReply({ embeds: [embed] });
//           return;
//         }

//         // Join the list of users and their counts in the embed's description
//         const topUsers = lists.sort((a, b) => b.count - a.count).slice(0, 3);
//         const totalCaught = topUsers.reduce((acc, user) => acc + user.count, 0);
//         const topList = topUsers.reduce((acc, user, index) => {
//           const percent = ((user.count / totalCaught) * 100).toFixed(2);
//           return (
//             acc +
//             `**${index + 1}.** ${user.username} - **caught ${
//               user.count
//             } times** \n   *(${percent}% more than other members)*.\n`
//           );
//         }, "");

//         const userCounts = lists
//           .map(
//             (user, index) =>
//               `**${index + 1}.** ${user.username} has been caught **${
//                 user.count
//               } time(s)**`
//           )
//           .join("\n")
//           .slice(0, 1900);

//         embed.fields[0] = { name: `👑 TOP PEOD 👑`, value: topList };
//         embed.fields[1] = { name: `Leaderboard`, value: userCounts };

//         // Post the message in the channel
//         await interaction.editReply({ embeds: [embed] });
//       }
//     } catch (err) {
//       ERROR_LOG(err);
//       console.error(err);
//     }
//   },
// };
