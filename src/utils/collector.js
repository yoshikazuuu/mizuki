const { TIMEOUT } = require("./constants");
const { wrongUser } = require("./ui");

function createCollector(m, interaction) {
  const filter = (button) => {
    if (button.user.id !== interaction.member.user.id) {
      button.reply({ embeds: [wrongUser], ephemeral: true });
      return false;
    }
    return true;
  };

  return m.createMessageComponentCollector({
    filter,
    time: TIMEOUT,
  });
}

module.exports = { createCollector };
