const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const { ERROR_LOG } = require("../utils/logger");
const { LLM_MODEL } = require("../utils/constants");
const { errorResponse } = require("../utils/helper");

// Load the env variables
const dotenv = require("dotenv");
const { getRandomPastelColor } = require("../utils/color");
dotenv.config();
const openai_token = process.env.OPENAI_TOKEN;

const configuration = new Configuration({
  apiKey: openai_token,
});
const openai = new OpenAIApi(configuration);
const ico = new AttachmentBuilder("assets/chatgpt_icon.png");

async function getAnswer(prompt) {
  const resp = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: [
      {
        role: "user",
        content: `${prompt}`,
      },
    ],
    top_p: 0.1,
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
      let prompt = interaction.options.getString("prompt");

      // Deferring the reply
      await interaction.deferReply({ ephemeral: true });

      // Fetch the API
      const { data } = await getAnswer(prompt);
      let answer = data.choices[0].message.content;
      let answers = [];

      // Handling the title if reaching the char limit
      const TITLE_LIMIT = 50;
      if (prompt.length > TITLE_LIMIT) {
        prompt = prompt.slice(0, TITLE_LIMIT).concat("...");
      }

      // Handling the answers if reaching the character limit
      const CHAR_LIMIT = 4050;
      if (answer.length > CHAR_LIMIT) {
        for (let i = 0; i < answer.length; i += CHAR_LIMIT) {
          const substring = answer.substring(i, i + CHAR_LIMIT);
          answers.push(substring);
        }
      } else {
        answers[0] = answer;
      }

      // Create the embed for the answer
      const embed = new EmbedBuilder()
        .setColor(getRandomPastelColor())
        .setAuthor({
          name: "Anon Q&A",
          iconURL: "attachment://chatgpt_icon.png",
        })
        .setTitle(`Q: ${prompt}`)
        .setDescription(`**A:** ${answers[0]}`)
        .setTimestamp()
        .setFooter({
          text: `Powered by ${LLM_MODEL}`,
        });

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
      await interaction.channel.send({ embeds: [embed], files: [ico] });

      // Send the follow-up if the answer more than 2000 chars
      for (let i = 1; i < answers.length; i++) {
        embed.setDescription(answers[i]);
        await interaction.followUp({
          embeds: [embed],
          files: [ico],
        });
      }
    } catch (err) {
      ERROR_LOG(err);
      errorResponse(interaction, err);
      console.error(err);
    }
  },
};
