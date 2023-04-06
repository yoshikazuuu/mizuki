const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");

// Load the env variables
dotenv.config();
const discord_clientId = process.env.DISCORD_CLIENTID;
const discord_guildId_dev = process.env.DISCORD_GUILDID_DEV;
const discord_token = process.env.DISCORD_TOKEN;

const rest = new REST({ version: "10" }).setToken(discord_token);
(async () => {
  try {
    // Delete existing commands (prevent duplicate)
    await rest
      .put(Routes.applicationCommands(discord_clientId), { body: [] })
      .catch(console.error);

    await rest
      .put(
        Routes.applicationGuildCommands(discord_clientId, discord_guildId_dev),
        { body: [] }
      )
      .catch(console.error);
  } catch (err) {
    console.error(err);
  }
})();
