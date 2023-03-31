const { Events, ActivityType } = require("discord.js");
const { READY_LOG } = require("../utils/logger");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    READY_LOG(client);
    client.user.setPresence({
      activities: [{ name: `with nii-sama!`, type: ActivityType.Playing }],
    });
  },
};
