const { SlashCommandBuilder } = require("discord.js");
const { ERROR_LOG } = require("../utils/log_template");
const axios = require("axios");

// Load the env variables
const dotenv = require("dotenv");
dotenv.config();
const openai_token = process.env.OPENAI_TOKEN;

async function getAnswer(language, prompt) {
  const resp = await axios({
    method: "post",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openai_token}`,
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

function sendCodeBlockMessage(codeBlock, MAX_MESSAGE_LENGTH) {
  let message = codeBlock;
  let openCodeBlock = false;
  let chunks = [];
  let prevIndex = -1;

  while (message.length > 0) {
    let index = message.indexOf("\n\n", prevIndex + 1);
    let chunkLength = index === -1 ? message.length : index;

    while (chunkLength <= MAX_MESSAGE_LENGTH && index !== -1) {
      prevIndex = index;
      index = message.indexOf("\n\n", index + 2);
      chunkLength = index === -1 ? message.length : index;
    }
    chunkLength = prevIndex;

    let chunk = message.substring(0, chunkLength);

    // Check if the chunk contains an open code block
    if (chunk.includes("```")) {
      // Loop through the chunk and find all occurrences of "```"
      for (let i = 0; i < chunk.length - 2; i++) {
        if (chunk.substr(i, 3) === "```") {
          if (openCodeBlock) {
            // If there is an open code block, close it
            openCodeBlock = false;
          } else {
            // Otherwise, open a new code block
            openCodeBlock = true;
          }
        }
      }
    }

    // If the chunk doesn't end with "```" and there is an open code block,
    // Add "```" to the end of the chunk and close the code block
    if (openCodeBlock && !chunk.endsWith("```")) {
      chunk = chunk + "\n```";
      openCodeBlock = false;
    }

    // If there is an open code block, add "```" to the front of the chunk
    if (openCodeBlock) {
      chunk = "```\n" + chunk;
    }

    chunks.push(chunk);

    // Remove the processed chunk from the message
    message = message.substring(chunkLength).trim();
  }

  return chunks;
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
      const MAX_MESSAGE_LENGTH = 1950;

      // Fetch the prompt from the command
      const prompt = interaction.options.getString("prompt");
      const language = interaction.options.getString("language");

      // Deferring the reply
      await interaction.deferReply();

      // Fetch the API
      const { data } = await getAnswer(language, prompt);

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
      console.error(err);
    }
  },
};
