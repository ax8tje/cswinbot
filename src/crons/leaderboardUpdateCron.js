const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { getPlayerInfo } = require('../util/apiHandler');
const { updateClanInfo } = require('../util/updateClanInfo');

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

// Helper to add delay between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function resetDailyBaselines() {
    console.log(`[DailyCron] Starting daily reset...`);
    const data = loadPlayerData();
    let successCount = 0;
    let failCount = 0;

    for (const [discordId, player] of Object.entries(data.players)) {
        try {
            const robloxData = await getPlayerInfo(player.robloxId);

            if (robloxData && robloxData.wins !== undefined) {
                player.dailyBaseline = robloxData.wins;
                successCount++;
            } else {
                console.warn(`[DailyCron] Failed to fetch data for ${player.robloxId}`);
                failCount++;
            }

            // Rate limiting: 100ms delay between API calls
            await sleep(100);
        } catch (err) {
            console.error(`[DailyCron] Error processing ${discordId}:`, err.message);
            failCount++;
        }
    }

    savePlayerData(data);
    console.log(`[DailyCron] Daily reset complete: ${successCount} success, ${failCount} failed at ${new Date().toLocaleString()}`);
}

async function resetWeeklyBaselines() {
    console.log(`[WeeklyCron] Starting weekly reset...`);
    const data = loadPlayerData();
    let successCount = 0;
    let failCount = 0;

    for (const [discordId, player] of Object.entries(data.players)) {
        try {
            const robloxData = await getPlayerInfo(player.robloxId);

            if (robloxData && robloxData.wins !== undefined) {
                player.weeklyBaseline = robloxData.wins;
                successCount++;

                // Update clan info during weekly reset
                if (player.clanId) {
                    await updateClanInfo(player.clanId);
                }
            } else {
                console.warn(`[WeeklyCron] Failed to fetch data for ${player.robloxId}`);
                failCount++;
            }

            // Rate limiting: 100ms delay between API calls
            await sleep(100);
        } catch (err) {
            console.error(`[WeeklyCron] Error processing ${discordId}:`, err.message);
            failCount++;
        }
    }

    savePlayerData(data);
    console.log(`[WeeklyCron] Weekly reset complete: ${successCount} success, ${failCount} failed at ${new Date().toLocaleString()}`);
}

// Daily at 11:05 PM EST (4:05 AM UTC) - 5 minutes after leaderboard post
cron.schedule('5 4 * * *', async () => {
    try {
        await resetDailyBaselines();
    } catch (err) {
        console.error('[DailyCron] Fatal error:', err);
    }
}, {
    timezone: "America/New_York"
});

// Weekly on Sunday 11:05 PM EST (4:05 AM UTC Monday) - same time as daily on Sundays
cron.schedule('5 4 * * 0', async () => {
    try {
        await resetWeeklyBaselines();
    } catch (err) {
        console.error('[WeeklyCron] Fatal error:', err);
    }
}, {
    timezone: "America/New_York"
});

console.log('✅ Cron jobs scheduled:');
console.log('   - Daily reset: 11:05 PM EST (5 min after post)');
console.log('   - Weekly reset: 11:05 PM EST Sunday (5 min after post)');