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
    name: "setwingoal",
    description: "Set weekly win goal for your clan members (Clan Owner only)",
    options: [
        {
            name: "goal",
            type: 4, // INTEGER
            description: "Weekly win goal (e.g., 500)",
            required: true,
            minValue: 1,
            maxValue: 10000
        }
    ],
    run: async (client, interaction) => {
        const discordId = interaction.user.id;
        const winGoal = interaction.options.getInteger("goal");

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

        const clanId = player.clanId.toString();

        // Step 3: Fetch clan owner from Roblox API
        const ownerData = await getClanOwner(clanId);

        if (!ownerData) {
            return interaction.editReply("❌ Failed to fetch clan owner data from Roblox API. Try again later.");
        }

        // Step 4: Check if this Discord user is the clan owner
        if (ownerData.ownerId !== player.robloxId) {
            return interaction.editReply(
                `❌ Only the clan owner can set win goals.\n\n` +
                `**Clan Owner:** ${ownerData.ownerUsername} (ID: ${ownerData.ownerId})\n` +
                `**Your Roblox ID:** ${player.robloxId}`
            );
        }

        // Step 5: Load clans and ensure clan entry exists
        const clansData = loadClans();

        // Make sure clans object exists
        if (!clansData.clans) {
            clansData.clans = {};
        }

        // Create or update clan entry
        if (!clansData.clans[clanId]) {
            clansData.clans[clanId] = {
                clanName: ownerData.clanName || "Unknown Clan",
                clanTag: "",
                winsOffset: 0
            };
        }

        // Set the weekly win goal
        clansData.clans[clanId].weeklyWinGoal = winGoal;

        // Update clan name in case it changed
        if (ownerData.clanName) {
            clansData.clans[clanId].clanName = ownerData.clanName;
        }

        // Save to file
        saveClans(clansData);

        // Count clan members
        const memberCount = Object.values(playerData.players).filter(
            p => p.clanId && p.clanId.toString() === clanId
        ).length;

        await interaction.editReply(
            `✅ **Weekly Win Goal Set!**\n\n` +
            `🎯 **Goal:** ${winGoal} wins per player\n` +
            `👥 **Clan:** ${clansData.clans[clanId].clanName}\n` +
            `📊 **Total Target:** ${winGoal * memberCount} wins (${memberCount} members)\n\n` +
            `All clan members must reach **${winGoal} weekly wins**!\n` +
            `Progress will show on \`/leaderboard\` and \`/mywins\`.`
        );
    }
};