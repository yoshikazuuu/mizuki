const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

const { LLM_MODEL } = require("./constants");

dotenv.config();
const openai_token = process.env.OPENAI_TOKEN;
const configuration = new Configuration({
  apiKey: openai_token,
});
const openai = new OpenAIApi(configuration);

async function getAnswer(messages) {
  const resp = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: [messages],
    top_p: 0.1,
  });

  return resp;
}

module.exports = { getAnswer };
