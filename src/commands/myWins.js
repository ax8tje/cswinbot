const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { getPlayerInfo } = require('../util/apiHandler');

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

module.exports = {
    name: "mywins",
    description: "Check your daily/weekly wins and progress",
    run: async (client, interaction) => {
        // Defer immediately since we're doing API calls
        await interaction.deferReply();

        const discordId = interaction.user.id;
        const playerData = loadPlayerData();
        const player = playerData.players[discordId];

        if (!player) {
            return interaction.editReply("❌ You haven't linked your Roblox ID yet. Use `/linkcs` first.");
        }

        // Fetch LIVE wins from API
        const robloxData = await getPlayerInfo(player.robloxId);
        if (!robloxData) {
            return interaction.editReply("❌ Failed to fetch your Roblox data. Try again later.");
        }

        const currentWins = robloxData.wins || 0;

        // Calculate wins based on baselines
        const dailyWins = Math.max(0, currentWins - (player.dailyBaseline || 0));
        const weeklyWins = Math.max(0, currentWins - (player.weeklyBaseline || 0));

        // Check for clan win goal
        let goalInfo = "";
        let progressBar = "";
        let goalColor = 0x00ff00; // Green by default

        if (player.clanId) {
            const clansData = loadClans();
            const clan = clansData.clans[player.clanId];

            if (clan && clan.weeklyWinGoal) {
                const goal = clan.weeklyWinGoal;
                const progress = Math.min(100, Math.floor((weeklyWins / goal) * 100));

                // Progress bar (20 blocks)
                const filledBlocks = Math.floor(progress / 5);
                const emptyBlocks = 20 - filledBlocks;
                progressBar = `[${"█".repeat(filledBlocks)}${"░".repeat(emptyBlocks)}] ${progress}%`;

                // Color based on progress
                if (weeklyWins >= goal) {
                    goalColor = 0x00ff00; // Green - Goal reached!
                    goalInfo = `\n\n🎯 **Weekly Goal:** ${weeklyWins}/${goal} ✅ **COMPLETE!**\n${progressBar}`;
                } else if (progress >= 75) {
                    goalColor = 0xffff00; // Yellow - Almost there
                    goalInfo = `\n\n🎯 **Weekly Goal:** ${weeklyWins}/${goal} (${goal - weeklyWins} to go)\n${progressBar}`;
                } else if (progress >= 50) {
                    goalColor = 0xffa500; // Orange - Halfway
                    goalInfo = `\n\n🎯 **Weekly Goal:** ${weeklyWins}/${goal} (${goal - weeklyWins} to go)\n${progressBar}`;
                } else {
                    goalColor = 0xff0000; // Red - Behind
                    goalInfo = `\n\n🎯 **Weekly Goal:** ${weeklyWins}/${goal} (${goal - weeklyWins} to go)\n${progressBar}`;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("📊 Your Stats")
            .setDescription(
                `🏆 **Total Wins:** ${currentWins}\n` +
                `📅 **Today:** +${dailyWins} wins\n` +
                `📆 **This Week:** +${weeklyWins} wins` +
                goalInfo
            )
            .setColor(goalColor)
            .setFooter({ text: "Resets: Daily at 11 PM EST, Weekly on Sundays" })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};