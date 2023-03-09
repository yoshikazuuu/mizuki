// Require the necessary discord.js classes
const fs = require("node:fs");
const path = require("node:path");
const {
  Collection,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");
const { clientId, guildId, token } = require("../config.json");
const { WARNING_LOG, PREP_LOG } = require("./utils/log_template");

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Loading commands
client.commands = new Collection();

// Check if configs folder exists or not if not create it
if (!fs.existsSync("configs")) {
  PREP_LOG(`Create configs folder.`);
  fs.mkdirSync("configs");
}

// Read all commands file
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    WARNING_LOG(
      `The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Reload commands
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    // Delete existing commands (prevent duplicate)
    // await rest
    //   .put(Routes.applicationCommands(clientId), { body: [] })
    //   .then(() => PREP_LOG("Successfully deleted all application commands."))
    //   .catch(console.error);

    PREP_LOG(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      {
        body: commands,
      }
    );

    PREP_LOG(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

// Read all events file
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Log in to Discord with your client's token
client.login(token);
