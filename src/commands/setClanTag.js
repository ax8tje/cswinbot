const fs = require("fs");
const path = require("path");
const { getClanOwner } = require("../util/apiHandler");

const PLAYER_DATA_PATH = path.join(__dirname, "../data/playerData.json");
const CLANS_PATH = path.join(__dirname, "../data/clans.json");

function loadPlayerData() {
    try {
        return JSON.parse(fs.readFileSync(PLAYER_DATA_PATH, "utf8"));
    } catch {
        return { players: {} };
    }
}

function loadClans() {
    try {
        return JSON.parse(fs.readFileSync(CLANS_PATH, "utf8"));
    } catch {
        return { clans: {} };
    }
}

function saveClans(data) {
    fs.writeFileSync(CLANS_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "setclantag",
    description: "Set your clan's tag (Clan Owner only)",
    options: [
        {
            name: "tag",
            type: 3,
            description: "Your clan tag (max 6 characters, e.g., [ES])",
            required: true,
            maxLength: 6
        }
    ],
    run: async (client, interaction) => {
        const discordId = interaction.user.id;
        const clanTag = interaction.options.getString("tag");

        // Defer immediately since we're doing API calls
        await interaction.deferReply({ flags: 64 }); // ephemeral

        // Step 1: Check if user is linked
        const playerData = loadPlayerData();
        const player = playerData.players[discordId];

        if (!player) {
            return interaction.editReply("❌ You haven't linked your Roblox account yet. Use `/linkcs` first.");
        }

        // Step 2: Check if user is in a clan
        if (!player.clanId) {
            return interaction.editReply("❌ You're not in a clan. Join a clan first!");
        }

        const clanId = player.clanId;

        // Step 3: Fetch clan owner from Roblox API
        const ownerData = await getClanOwner(clanId);

        if (!ownerData) {
            return interaction.editReply("❌ Failed to fetch clan owner data from Roblox API. Try again later.");
        }

        // Step 4: Check if this Discord user is the clan owner
        if (ownerData.ownerId !== player.robloxId) {
            return interaction.editReply(
                `❌ Only the clan owner can set the clan tag.\n\n` +
                `**Clan Owner:** ${ownerData.ownerUsername} (ID: ${ownerData.ownerId})\n` +
                `**Your Roblox ID:** ${player.robloxId}`
            );
        }

        // Step 5: Set the clan tag
        const clansData = loadClans();

        if (!clansData.clans[clanId]) {
            clansData.clans[clanId] = {
                clanName: ownerData.clanName || "Unknown Clan",
                winsOffset: 0
            };
        }

        clansData.clans[clanId].clanTag = clanTag;
        saveClans(clansData);

        await interaction.editReply(
            `✅ **Clan Tag Updated!**\n\n` +
            `🏷️ **Tag:** ${clanTag}\n` +
            `👥 **Clan:** ${clansData.clans[clanId].clanName}\n` +
            `🆔 **Clan ID:** ${clanId}\n\n` +
            `Your clan tag will now appear on leaderboards!`
        );
    }
};