const fs = require("fs");
const path = require("path");
const { InteractionContextType } = require("discord.js");
const { getPlayerInfo } = require("../util/apiHandler");
const { updateClanInfo } = require("../util/updateClanInfo");

module.exports = {
    name: "linkcs",
    description: "Link your Roblox ID and update clan info",
    options: [
        {
            name: "robloxid",
            type: 3,
            description: "Your Roblox ID",
            required: true
        }
    ],
    run: async (client, interaction) => {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 }); // flags: 64 = ephemeral

        const discordId = interaction.user.id;
        const robloxId = interaction.options.getString("robloxid");

        // Fetch live data from API
        const playerData = await getPlayerInfo(robloxId);
        if (!playerData) {
            return interaction.editReply("❌ Failed to fetch data from API. Check if the Roblox ID is valid.");
        }

        const dataPath = path.join(__dirname, "../data/playerData.json");

        let data = { players: {} };
        try {
            data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        } catch {}

        if (!data.players) data.players = {};

        // Check if this Roblox ID is already linked to another Discord account
        for (const [existingDiscordId, existingPlayer] of Object.entries(data.players)) {
            if (existingPlayer.robloxId === robloxId && existingDiscordId !== discordId) {
                return interaction.editReply({
                    content: `❌ **Roblox ID Already Linked!**\n\n` +
                        `This Roblox account is already linked to <@${existingDiscordId}>.\n` +
                        `Each Roblox account can only be linked to one Discord account.\n\n` +
                        `If this is your account, ask them to unlink it first.`
                });
            }
        }

        // Check if user is already linked (re-linking)
        const isRelink = data.players[discordId] && data.players[discordId].robloxId === robloxId;

        if (isRelink) {
            return interaction.editReply({
                content: `⚠️ **Already Linked!**\n\n` +
                    `You're already linked to Roblox ID: ${robloxId}\n` +
                    `Current wins: ${playerData.wins || 0}\n\n` +
                    `Use \`/unlinkcs\` if you want to link a different account.`
            });
        }

        // First time linking: Set new baselines
        data.players[discordId] = {
            robloxId,
            clanId: playerData.clanId || null,
            dailyBaseline: playerData.wins || 0,
            weeklyBaseline: playerData.wins || 0
        };

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        // Update clan info if player is in a clan
        if (playerData.clanId) {
            await updateClanInfo(playerData.clanId);
        }

        await interaction.editReply(
            `✅ **Linked Successfully!**\n\n` +
            `🎮 Roblox ID: ${robloxId}\n` +
            `🏆 Total Wins: ${playerData.wins || 0}\n` +
            `👥 Clan: ${playerData.clanId ? `ID ${playerData.clanId}` : "None"}\n\n` +
            `Your daily and weekly baselines have been set.`
        );
    }
};