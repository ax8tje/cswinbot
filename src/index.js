require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const handleCommands = require("./functions/handleCommands");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load and handle commands dynamically
handleCommands(client);

// Load cron jobs
require("./crons/leaderboardUpdateCron");

client.once("clientReady", () => {
    console.log(`Bot is online as ${client.user.tag}`);
    console.log(`✅ Cron jobs loaded`);

    // Load leaderboard post cron (needs client)
    require("./crons/leaderboardPostCron")(client);
});

client.login(process.env.DISCORD_TOKEN);