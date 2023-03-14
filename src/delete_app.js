const { REST, Routes } = require("discord.js");
const {
  discord_clientId,
  discord_guildId_dev,
  discord_token,
} = require("../config.json");

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
    console.log(err);
  }
})();

