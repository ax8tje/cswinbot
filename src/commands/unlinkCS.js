const fs = require("fs");
const path = require("path");

const PLAYER_DATA_PATH = path.join(__dirname, "../data/playerData.json");

function loadPlayerData() {
    try {
        return JSON.parse(fs.readFileSync(PLAYER_DATA_PATH, "utf8"));
    } catch {
        return { players: {} };
    }
}

function savePlayerData(data) {
    fs.writeFileSync(PLAYER_DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "unlinkcs",
    description: "Unlink your Roblox account from Discord",
    run: async (client, interaction) => {
        const discordId = interaction.user.id;
        const data = loadPlayerData();

        // Check if user is linked
        if (!data.players[discordId]) {
            return interaction.reply({
                content: "❌ You don't have a linked Roblox account.",
                flags: 64 // ephemeral
            });
        }

        const robloxId = data.players[discordId].robloxId;

        // Remove player data
        delete data.players[discordId];
        savePlayerData(data);

        await interaction.reply({
            content: `✅ **Unlinked Successfully!**\n\n` +
                `Your Discord account is no longer linked to Roblox ID: ${robloxId}\n` +
                `You can link a different account using \`/linkcs\`.`,
            flags: 64 // ephemeral
        });
    }
};