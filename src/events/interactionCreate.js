const { Events } = require("discord.js");
const { ERROR_LOG, COMMAND_LOG, ANON_LOG } = require("../utils/log_template");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        ERROR_LOG(`No command matching ${interaction.commandName} was found.`);
        return;
      } else if (interaction.commandName == "confess") {
        ANON_LOG(interaction.commandName);
      } else {
        COMMAND_LOG(interaction, interaction.commandName);
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        ERROR_LOG(error);
        await interaction.editReply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      // const { customId } = interaction;
      // if (!button) {
      //   ERROR_LOG(`No button operation was found.`);
      //   return;
      // }
      // try {
      //   await button.execute(interaction);
      // } catch (error) {
      //   ERROR_LOG(error);
      //   await interaction.reply({
      //     content: "There was an error while executing this button!",
      //     ephemeral: true,
      //   });
      // }
    }
  },
};
