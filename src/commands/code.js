const { SlashCommandBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const { ERROR_LOG } = require("../utils/log_template");
const { openai_api } = require("../../config.json");
const { EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");

async function getAnswer(language, prompt) {
  const resp = await axios({
    method: "post",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openai_api}`,
    },
    data: {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `code this in ${language} with the following requirements ${prompt} and don't forget to format it using \`\`\``,
        },
      ],
      temperature: 0,
    },
  });

  return resp;
}

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
      // Fetch the prompt from the command
      const prompt = interaction.options.getString("prompt");
      const language = interaction.options.getString("language");

      // Deferring the reply
      await interaction.deferReply();

      // Fetch the API
      const { data } = await getAnswer(language, prompt);

      let answer = data.choices[0].message.content;
      if (answer.startsWith("\n")) {
        answer = answer.trim().replace(/^[\n\r\s]+/, "");
      }

      // Send the code
      await interaction.editReply({
        content: answer,
      });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
