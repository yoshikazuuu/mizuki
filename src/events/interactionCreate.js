const { Events } = require("discord.js");
const { ERROR_LOG, COMMAND_LOG, ANON_LOG } = require("../utils/logger");
const { errorInteraction } = require("../utils/helper");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        ERROR_LOG(`No command matching ${interaction.commandName} was found.`);
        return;
      } else if (
        interaction.commandName == "confess" ||
        interaction.commandName == "anongpt"
      ) {
        ANON_LOG(interaction.commandName);
      } else {
        COMMAND_LOG(interaction, interaction.commandName);
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        ERROR_LOG(error);
        errorInteraction(interaction);
      }
    }
  },
};
