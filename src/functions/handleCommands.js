const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    client.commands = new Map();

    const commandsPath = path.join(__dirname, "../commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
    }

    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.run(client, interaction);

        } catch (err) {
            console.error("Command error:", err);

            try {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.editReply("An error occurred while executing this command.");
                }

                return await interaction.reply({
                    content: "An error occurred while executing this command.",
                    flags: 64
                });

            } catch (innerErr) {
                console.error("Secondary interaction error:", innerErr);
            }
        }
    });
};
