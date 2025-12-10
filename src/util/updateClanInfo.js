const fs = require("fs");
const path = require("path");
const { getClanName } = require("./apiHandler");

const CLANS_PATH = path.join(__dirname, "../data/clans.json");

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

async function updateClanInfo(clanId) {
    const data = loadClans();
    if (!data.clans) data.clans = {};

    const clanName = await getClanName(clanId);

    if (!data.clans[clanId]) {
        data.clans[clanId] = {
            clanName: clanName || "",
            winsOffset: 0
        };
    } else if (clanName) {
        data.clans[clanId].clanName = clanName;
    }

    saveClans(data);
}

module.exports = { updateClanInfo };
