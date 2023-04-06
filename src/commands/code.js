const { SlashCommandBuilder } = require("discord.js");

const { sendCodeBlockMessage } = require("./code/utils");
const { errorResponse } = require("../utils/helper");
const { ERROR_LOG } = require("../utils/logger");
const { getAnswer } = require("../utils/openai");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("code")
    .setDescription("Ask bot to code something.")
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Your desired coding language.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("What you want the bot to code.")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      const MAX_MESSAGE_LENGTH = 1950;

      // Fetch the prompt from the command
      const prompt = interaction.options.getString("prompt");
      const language = interaction.options.getString("language");
      const messages = [
        {
          role: "system",
          content:
            "You are a professional coder that always code with proper format it using ``` and language that specified",
        },
        {
          role: "user",
          content: `code this in ${language} with the following requirements ${prompt}`,
        },
      ];

      // Deferring the reply
      await interaction.deferReply();

      // Fetch the API
      const { data } = await getAnswer(messages);

      let answer = data.choices[0].message.content;
      let sliced = [];
      if (answer.startsWith("\n")) {
        answer = answer.trim().replace(/^[\n\r\s]+/, "");
      }

      // Checking if the length more than MAX_MESSAGE_LENGTH
      if (answer.length > MAX_MESSAGE_LENGTH) {
        sliced = sendCodeBlockMessage(answer, MAX_MESSAGE_LENGTH);
      } else {
        await interaction.editReply({
          content: answer,
        });
        return;
      }

      // Send the code`
      await interaction.editReply({
        content: sliced[0],
      });

      // Send the follow-up if the answer more than 2000 chars
      for (let i = 1; i < sliced.length; i++) {
        await interaction.followUp({
          content: sliced[i],
        });
      }
    } catch (err) {
      ERROR_LOG(err);
      errorResponse(interaction, err);
      console.error(err);
    }
  },
};
