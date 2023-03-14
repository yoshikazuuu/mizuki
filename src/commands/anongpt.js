const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const { openai_token, anongpt_payload } = require("../../config.json");
const { ERROR_LOG } = require("../utils/log_template");

const configuration = new Configuration({
  apiKey: openai_token,
});
const openai = new OpenAIApi(configuration);

async function getAnswer(prompt) {
  const resp = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${anongpt_payload} ${prompt}`,
    temperature: 1,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
  });

  return resp;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("anongpt")
    .setDescription("Ask something anonymously.")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Your prompt").setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Fetch the prompt from the command
      const prompt = interaction.options.getString("prompt");

      // Deferring the reply
      await interaction.deferReply({ ephemeral: true });

      // Fetch the API
      const { data } = await getAnswer(prompt);
      let answer = data.choices[0].text;

      // Check the payload
      if (anongpt_payload) {
        let index = answer.indexOf("DAN:");
        if (index !== -1) {
          answer = answer.substring(index + 4).trim();
        }
      } else {
        if (answer.startsWith("\n")) {
          answer = answer.trim().replace(/^[\n\r\s]+/, "");
        }
      }

      // Create the embed for the answer
      const embed = new EmbedBuilder()
        .setColor("#" + Math.floor(Math.random() * 16777215).toString(16))
        .setTitle(`Anon Q&A`)
        .addFields(
          {
            name: `Question`,
            value: `"${prompt}"`,
          },
          {
            name: `Answer`,
            value: `"${answer}"`,
          }
        )
        .setTimestamp();

      // Send the confirmation
      await interaction.editReply({
        embeds: [
          {
            color: 0xf6c1cc,
            description: "Sending *nii-sama's* anon question...  ",
          },
        ],
        ephemeral: true,
      });

      // Send the answer
      await interaction.channel.send({ embeds: [embed] });
    } catch (err) {
      ERROR_LOG(err);
      console.error(err);
    }
  },
};
