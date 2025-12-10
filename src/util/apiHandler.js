const axios = require("axios");

async function getPlayerInfo(robloxId) {
    try {
        const fields = ["clanId", "wins"];
        const url = `https://combat.surf/api/player-info?userId=${robloxId}&fields=${fields.join(",")}`;
        const res = await axios.get(url);
        return res.data;
    } catch (err) {
        console.error("Error fetching player info:", err.message);
        return null;
    }
}

async function getRobloxUsername(robloxId) {
    try {
        const res = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        return res.data?.name || res.data?.displayName || null;
    } catch (err) {
        console.error("Error fetching Roblox username:", err.message);
        return null;
    }
}

async function getClanName(clanId) {
    try {
        const res = await axios.get(`https://groups.roblox.com/v1/groups/${clanId}`);
        return res.data?.name || null;
    } catch (err) {
        console.error("Error fetching clan name:", err.message);
        return null;
    }
}

async function getClanOwner(clanId) {
    try {
        const res = await axios.get(`https://groups.roblox.com/v1/groups/${clanId}`);

        if (!res.data || !res.data.owner) {
            console.error("No owner data found for clan:", clanId);
            return null;
        }

        return {
            ownerId: res.data.owner.userId.toString(),
            ownerUsername: res.data.owner.username,
            clanName: res.data.name
        };
    } catch (err) {
        console.error("Error fetching clan owner:", err.message);
        return null;
    }
}

module.exports = {
    getPlayerInfo,
    getRobloxUsername,
    getClanName,
    getClanOwner
};