// commands/leaderboard.js
const fs = require("fs");
const path = require("path");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { getPlayerInfo, getRobloxUsername } = require("../util/apiHandler");

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

function findClanByTag(clansData, searchTag) {
    const normalizedSearch = searchTag.toLowerCase().replace(/[\[\]]/g, "");

    for (const [clanId, clan] of Object.entries(clansData.clans)) {
        if (!clan.clanTag) continue;
        const normalizedTag = clan.clanTag.toLowerCase().replace(/[\[\]]/g, "");
        if (normalizedTag === normalizedSearch) {
            return { clanId, ...clan };
        }
    }
    return null;
}

function centerText(text, width = 42) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
}

// Fetch player data with Roblox username
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

// Generate ALL-TIME leaderboard
async function generateAllTimeLeaderboard(clan, clanMembers) {
    const leaderboard = [];

    for (const member of clanMembers) {
        const data = await fetchPlayerData(member);
        if (data) {
            leaderboard.push({ username: data.username, wins: data.wins });
        }
    }

    leaderboard.sort((a, b) => b.wins - a.wins);

    if (leaderboard.length > 0 && leaderboard[0].wins > 0) {
        leaderboard[0].username += " 👑";
    }

    const totalWins = leaderboard.reduce((sum, p) => sum + p.wins, 0);

    const lines = [
        "Rank  Name                 Total Wins",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ];

    leaderboard.forEach((p, i) => {
        const rank = `${i + 1}`.padStart(4, " ");
        const name = p.username.substring(0, 20).padEnd(20, " ");
        const wins = `${p.wins}`.padStart(10, " ");
        lines.push(`${rank}  ${name} ${wins}`);
    });

    lines.push("");
    lines.push(centerText(`🏆 Total Clan Wins: ${totalWins}`));

    return new EmbedBuilder()
        .setTitle(`🏆 ${clan.clanTag} — ALL-TIME Leaderboard`)
        .setDescription("```\n" + lines.join("\n") + "\n```")
        .setColor(0x00ff00)
        .setFooter({ text: `${clan.clanName} • ${leaderboard.length} members` });
}

// Generate NORMAL (Daily/Weekly) leaderboard
async function generateNormalLeaderboard(clan, clanMembers) {
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

        // Show goal if set, otherwise just weekly wins
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
        .setTitle(`🏆 ${clan.clanTag} — NORMAL Leaderboard`)
        .setDescription("```\n" + lines.join("\n") + "\n```")
        .setColor(0x00ff00)
        .setFooter({ text: `${clan.clanName} • ${leaderboard.length} members` });
}

module.exports = {
    name: "leaderboard",
    description: "View clan leaderboard by tag (choose NORMAL or ALL-TIME)",
    options: [
        {
            name: "clantag",
            type: 3,
            description: "Clan tag (e.g., HoC, ES, tm)",
            required: true
        }
    ],

    run: async (client, interaction) => {
        const searchTag = interaction.options.getString("clantag");
        await interaction.deferReply();

        const clansData = loadClans();
        const clan = findClanByTag(clansData, searchTag);

        if (!clan) {
            return interaction.editReply(`❌ No clan found with tag **${searchTag}**.`);
        }

        const playerData = loadPlayerData();
        const clanMembers = [];

        for (const [discordId, player] of Object.entries(playerData.players)) {
            if (player.clanId && player.clanId.toString() === clan.clanId) {
                clanMembers.push({ discordId, ...player });
            }
        }

        if (clanMembers.length === 0) {
            return interaction.editReply(`❌ No players linked to **${clan.clanName}** (${clan.clanTag}).`);
        }

        // Create selection buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`lb_normal_${clan.clanId}`)
                .setLabel("NORMAL")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`lb_alltime_${clan.clanId}`)
                .setLabel("ALL-TIME")
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${clan.clanTag} — Select leaderboard type`)
            .setDescription(
                "**NORMAL** — shows Daily / Weekly progress\n" +
                "**ALL-TIME** — total wins since start\n\n" +
                "Click once. You cannot switch afterwards."
            )
            .setColor(0x00ff00)
            .setFooter({ text: `${clan.clanName} • ${clanMembers.length} members` });

        const msg = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: "Only the command author can use these buttons.", flags: 64 });
            }

            await btn.deferUpdate();
            row.components.forEach(c => c.setDisabled(true));

            let resultEmbed;

            if (btn.customId.startsWith("lb_alltime")) {
                resultEmbed = await generateAllTimeLeaderboard(clan, clanMembers);
            } else {
                resultEmbed = await generateNormalLeaderboard(clan, clanMembers);
            }

            return interaction.editReply({ embeds: [resultEmbed], components: [] });
        });

        collector.on("end", async () => {
            try {
                row.components.forEach(c => c.setDisabled(true));
                await interaction.editReply({ components: [row] });
            } catch {}
        });
    }
};