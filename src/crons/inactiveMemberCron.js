const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { getPlayerInfo } = require('../util/apiHandler');

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

async function checkInactiveMembers() {
    console.log(`[InactiveCron] Checking for members not in a clan...`);
    const data = loadPlayerData();
    let removedCount = 0;
    let checkedCount = 0;

    const playersToRemove = [];

    for (const [discordId, player] of Object.entries(data.players)) {
        try {
            const robloxData = await getPlayerInfo(player.robloxId);
            checkedCount++;

            // If player has no clanId (not in a clan), mark for removal
            if (!robloxData || !robloxData.clanId) {
                console.log(`[InactiveCron] Player ${player.robloxId} (Discord: ${discordId}) is not in a clan - removing`);
                playersToRemove.push(discordId);
            }

            // Rate limiting: 100ms delay between API calls
            await sleep(100);
        } catch (err) {
            console.error(`[InactiveCron] Error checking ${discordId}:`, err.message);
        }
    }

    // Remove all players that are not in a clan
    for (const discordId of playersToRemove) {
        delete data.players[discordId];
        removedCount++;
    }

    if (removedCount > 0) {
        savePlayerData(data);
    }

    console.log(`[InactiveCron] Check complete: ${checkedCount} checked, ${removedCount} removed at ${new Date().toLocaleString()}`);
}

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
    try {
        await checkInactiveMembers();
    } catch (err) {
        console.error('[InactiveCron] Fatal error:', err);
    }
});

console.log('   - Inactive member check: Every 10 minutes');
