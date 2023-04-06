const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/logger");
const { LLM_MODEL, ICO_AI } = require("../utils/constants");
const { errorResponse } = require("../utils/helper");
const { getRandomPastelColor } = require("../utils/color");
const { getAnswer } = require("../utils/openai");

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
      const messages = [
        {
          role: "user",
          content: `${prompt}`,
        },
      ];

      // Deferring the reply
      await interaction.deferReply({ ephemeral: true });

      // Fetch the API
      const { data } = await getAnswer(messages);
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
      await interaction.channel.send({ embeds: [embed], files: [ICO_AI] });

      // Send the follow-up if the answer more than 2000 chars
      for (let i = 1; i < answers.length; i++) {
        embed.setDescription(answers[i]);
        await interaction.followUp({
          embeds: [embed],
          files: [ICO_AI],
        });
      }
    } catch (err) {
      ERROR_LOG(err);
      errorResponse(interaction, err);
      console.error(err);
    }
  },
};
