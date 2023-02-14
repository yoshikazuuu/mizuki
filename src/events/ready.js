const { Events } = require("discord.js");
const { READY_LOG } = require("../utils/log_template");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    READY_LOG(client);
  },
};
