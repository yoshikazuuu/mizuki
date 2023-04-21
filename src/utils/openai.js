const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

const { LLM_MODEL } = require("./constants");

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_TOKEN,
});
const openai = new OpenAIApi(configuration);

async function getAnswer(messages) {
  const resp = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: messages,
    top_p: 0.1,
  });

  return resp;
}

module.exports = { getAnswer };
