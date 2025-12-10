require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push({
        name: command.name,
        description: command.description || "No description",
        options: command.options || []
    });
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log("Successfully registered guild commands!");
    } catch (err) {
        console.error(err);
    }
})();
