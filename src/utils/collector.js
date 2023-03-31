const { WRONGUSER, TIMEOUT } = require("../commands/mangadex/utils/constants");

function createCollector(m, interaction) {
  const filter = (button) => {
    if (button.user.id !== interaction.member.user.id) {
      button.reply({ embeds: [WRONGUSER], ephemeral: true });
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
