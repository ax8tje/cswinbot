const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const { getPlayerInfo, getRobloxUsername } = require('../util/apiHandler');

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

function centerText(text, width = 42) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
}

async function fetchPlayerData(member) {
    const robloxData = await getPlayerInfo(member.robloxId).catch(() => null);
    if (!robloxData) return null;

    const robloxUsername = await getRobloxUsername(member.robloxId).catch(() => null);
    const username = robloxUsername || `User${member.robloxId.slice(-4)}`;

    return {
        username,
        wins: robloxData.wins || 0,
        daily: Math.max(0, robloxData.wins - (member.dailyBaseline || 0)),
        weekly: Math.max(0, robloxData.wins - (member.weeklyBaseline || 0))
    };
}

async function generateLeaderboard(clan, clanMembers) {
    const leaderboard = [];
    let totalDaily = 0;
    let totalWeekly = 0;

    for (const member of clanMembers) {
        const data = await fetchPlayerData(member);
        if (data) {
            leaderboard.push({ username: data.username, daily: data.daily, weekly: data.weekly });
            totalDaily += data.daily;
            totalWeekly += data.weekly;
        }
    }

    leaderboard.sort((a, b) => b.daily - a.daily || b.weekly - a.weekly);

    if (leaderboard.length > 0 && leaderboard[0].daily > 0) {
        leaderboard[0].username += " 👑";
    }

    const weeklyGoal = clan.weeklyWinGoal || 0;

    const lines = [
        "Rank  Name                     Daily  Weekly",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ];

    leaderboard.forEach((p, i) => {
        const rank = `${i + 1}`.padStart(4, " ");
        const name = p.username.substring(0, 20).padEnd(20, " ");
        const daily = `${p.daily}`.padStart(5, " ");
        const weeklyDisplay = weeklyGoal > 0
            ? `${p.weekly}/${weeklyGoal}`.padStart(10, " ")
            : `${p.weekly}`.padStart(10, " ");
        lines.push(`${rank}  ${name} ${daily}  ${weeklyDisplay}`);
    });

    lines.push("");
    lines.push(centerText(`📊 Total Daily: ${totalDaily}`));

    if (weeklyGoal > 0) {
        const goalTotal = weeklyGoal * leaderboard.length;
        lines.push(centerText(`📈 Total Weekly: ${totalWeekly}/${goalTotal}`));
    } else {
        lines.push(centerText(`📈 Total Weekly: ${totalWeekly}`));
    }

    return new EmbedBuilder()
        .setTitle(`🏆 ${clan.clanTag || clan.clanName} — Daily Leaderboard`)
        .setDescription("```\n" + lines.join("\n") + "\n```")
        .setColor(0x00ff00)
        .setFooter({ text: `${clan.clanName} • ${leaderboard.length} members` })
        .setTimestamp();
}

async function postLeaderboards(client) {
    console.log(`[LeaderboardPost] Starting daily leaderboard post...`);

    const clansData = loadClans();
    const playerData = loadPlayerData();

    let successCount = 0;
    let failCount = 0;

    for (const [clanId, clan] of Object.entries(clansData.clans)) {
        // Skip if no channel is set
        if (!clan.leaderboardChannelId) {
            console.log(`[LeaderboardPost] Clan ${clan.clanName} has no channel set, skipping...`);
            continue;
        }

        try {
            // Get clan members
            const clanMembers = [];
            for (const [discordId, player] of Object.entries(playerData.players)) {
                if (player.clanId && player.clanId.toString() === clanId) {
                    clanMembers.push({ discordId, ...player });
                }
            }

            if (clanMembers.length === 0) {
                console.log(`[LeaderboardPost] Clan ${clan.clanName} has no members, skipping...`);
                continue;
            }

            // Fetch channel
            const channel = await client.channels.fetch(clan.leaderboardChannelId).catch(() => null);

            if (!channel) {
                console.warn(`[LeaderboardPost] Channel ${clan.leaderboardChannelId} not found for ${clan.clanName}`);
                failCount++;
                continue;
            }

            // Generate and post leaderboard
            const embed = await generateLeaderboard(clan, clanMembers);
            await channel.send({ embeds: [embed] });

            console.log(`[LeaderboardPost] Posted leaderboard for ${clan.clanName}`);
            successCount++;

            // Rate limiting between clans
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err) {
            console.error(`[LeaderboardPost] Error posting for ${clan.clanName}:`, err.message);
            failCount++;
        }
    }

    console.log(`[LeaderboardPost] Complete: ${successCount} success, ${failCount} failed`);
}

module.exports = (client) => {
    // Daily leaderboard post at 11:00 PM EST (4:00 AM UTC) - every day
    cron.schedule('0 23 * * *', async () => {
        try {
            await postLeaderboards(client);
        } catch (err) {
            console.error('[LeaderboardPost] Cron error:', err);
        }
    }, {
        timezone: "America/New_York"
    });

    console.log('✅ Leaderboard post cron scheduled:');
    console.log('   - Daily post: 11:00 PM EST (every day)');
};