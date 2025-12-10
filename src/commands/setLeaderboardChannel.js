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
    name: "setchannel",
    description: "Set the channel for automatic leaderboard posts (Clan Owner only)",
    options: [
        {
            name: "channel",
            type: 7, // CHANNEL
            description: "Channel where leaderboards will be posted",
            required: true,
            channelTypes: [0] // TEXT channel only
        }
    ],
    run: async (client, interaction) => {
        const discordId = interaction.user.id;
        const channel = interaction.options.getChannel("channel");

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
                `❌ Only the clan owner can set the leaderboard channel.\n\n` +
                `**Clan Owner:** ${ownerData.ownerUsername} (ID: ${ownerData.ownerId})\n` +
                `**Your Roblox ID:** ${player.robloxId}`
            );
        }

        // Step 5: Check bot permissions in the channel
        const botMember = await interaction.guild.members.fetch(client.user.id);
        const permissions = channel.permissionsFor(botMember);

        if (!permissions.has("SendMessages")) {
            return interaction.editReply(
                `❌ I don't have permission to send messages in ${channel}!\n\n` +
                `Please give me **Send Messages** permission in that channel.`
            );
        }

        if (!permissions.has("EmbedLinks")) {
            return interaction.editReply(
                `❌ I don't have permission to embed links in ${channel}!\n\n` +
                `Please give me **Embed Links** permission in that channel.`
            );
        }

        // Step 6: Save channel ID to clans.json
        const clansData = loadClans();

        if (!clansData.clans) {
            clansData.clans = {};
        }

        if (!clansData.clans[clanId]) {
            clansData.clans[clanId] = {
                clanName: ownerData.clanName || "Unknown Clan",
                clanTag: "",
                winsOffset: 0
            };
        }

        clansData.clans[clanId].leaderboardChannelId = channel.id;

        // Update clan name if available
        if (ownerData.clanName) {
            clansData.clans[clanId].clanName = ownerData.clanName;
        }

        saveClans(clansData);

        await interaction.editReply(
            `✅ **Leaderboard Channel Set!**\n\n` +
            `📺 **Channel:** ${channel}\n` +
            `👥 **Clan:** ${clansData.clans[clanId].clanName}\n\n` +
            `Leaderboards will be posted automatically:\n` +
            `• **Daily** at 11 PM EST\n` +
            `• **Weekly** on Sundays at 11 PM EST`
        );
    }
};