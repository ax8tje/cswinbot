# CS Win Bot 🏆

Discord bot for tracking Roblox Counter Strike player wins and managing clan leaderboards.

## Description

CS Win Bot allows Roblox CS players to link their Discord accounts with Roblox IDs, track daily and weekly wins, and compete with clan members on leaderboards. The bot automatically updates statistics and posts leaderboards on a schedule.

## Features

### For Players
- 🔗 Link Discord account with Roblox ID
- 📊 Track daily and weekly wins
- 🏆 View personal statistics and progress
- 🎯 Monitor progress towards clan goals
- 📈 Clan leaderboards (NORMAL and ALL-TIME)

### For Clan Leaders
- 🎯 Set weekly win goals for members
- 🏷️ Set clan tags
- 📺 Configure channel for automatic leaderboards
- 👥 Manage clan information

### Automation
- ⏰ Automatic leaderboard posting daily at 11:00 PM EST
- 🔄 Daily statistics reset at 11:05 PM EST
- 📅 Weekly statistics reset on Sundays at 11:05 PM EST

## Requirements

- **Node.js**: v16.x or higher
- **npm**: v7.x or higher
- **Discord Bot Token**: [Create a bot in Discord Developer Portal](https://discord.com/developers/applications)
- **Roblox API**: Bot uses Roblox API to fetch player data

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cswinbot.git
cd cswinbot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory:
```bash
touch .env
```

4. Add your Discord Token to `.env` file:
```env
DISCORD_TOKEN=your-discord-bot-token-here
```

5. Create data directory and required JSON files:
```bash
mkdir -p src/data
echo '{"players":{}}' > src/data/playerData.json
echo '{"clans":{}}' > src/data/clans.json
```

## Running the Bot

Start the bot:
```bash
node src/index.js
```

Or add to `package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/index.js"
  }
}
```

Then run:
```bash
npm start
```

## Commands

### Commands for All Users

#### `/linkcs <robloxid>`
Links your Discord account with your Roblox ID.
- **Parameters**:
  - `robloxid` - Your Roblox ID (required)
- **Example**: `/linkcs 123456789`
- **Description**: Sets initial baseline values for daily and weekly wins. Updates clan information if player belongs to a clan.

#### `/unlinkcs`
Unlinks your Roblox account from Discord.
- **Parameters**: None
- **Description**: Removes the link between your Discord and Roblox ID. You can then link a different account.

#### `/mywins`
Displays your statistics: daily wins, weekly wins, and goal progress.
- **Parameters**: None
- **Shows**:
  - 🏆 Total wins
  - 📅 Daily wins (since last reset)
  - 📆 Weekly wins (since last reset)
  - 🎯 Progress towards weekly goal (if set)
  - Progress bar with color coding

#### `/leaderboard <clantag>`
Displays clan leaderboard with NORMAL or ALL-TIME option.
- **Parameters**:
  - `clantag` - Clan tag (e.g., HoC, ES, tm) (required)
- **Example**: `/leaderboard HoC`
- **Types**:
  - **NORMAL** - Shows daily and weekly wins
  - **ALL-TIME** - Shows total wins since start

### Commands for Clan Leaders

#### `/setclantag <tag>`
Sets your clan tag (clan owner only).
- **Parameters**:
  - `tag` - Clan tag, max 6 characters (required)
- **Example**: `/setclantag [HoC]`
- **Requirements**: Must be the clan owner in Roblox

#### `/setwingoal <goal>`
Sets weekly win goal for clan members (clan owner only).
- **Parameters**:
  - `goal` - Number of wins (1-10000) (required)
- **Example**: `/setwingoal 500`
- **Requirements**: Must be the clan owner in Roblox
- **Effect**: Goal will appear in `/mywins` and on leaderboards

#### `/setchannel <channel>`
Sets channel for automatic leaderboard posts (clan owner only).
- **Parameters**:
  - `channel` - Discord text channel (required)
- **Example**: `/setchannel #leaderboards`
- **Requirements**:
  - Must be the clan owner in Roblox
  - Bot must have "Send Messages" and "Embed Links" permissions in the channel
- **Effect**: Leaderboards will be automatically posted daily at 11:00 PM EST

### Special Commands

#### `/bigdawg`
Fun command.

## Automated Schedule

The bot performs the following actions automatically:

| Action | Schedule | Description |
|--------|----------|-------------|
| **Post Leaderboard** | Daily 11:00 PM EST | Posts leaderboards in all configured channels |
| **Daily Reset** | Daily 11:05 PM EST | Resets daily baseline wins for all players |
| **Weekly Reset** | Sunday 11:05 PM EST | Resets weekly baseline wins for all players |

## File Structure

```
cswinbot/
├── src/
│   ├── commands/           # Discord slash commands
│   │   ├── linkCS.js       # Link Roblox ID
│   │   ├── unlinkCS.js     # Unlink account
│   │   ├── myWins.js       # Player statistics
│   │   ├── leaderboard.js  # Clan leaderboards
│   │   ├── setClanTag.js   # Set clan tag
│   │   ├── setWinGoal.js   # Set goals
│   │   ├── setLeaderboardChannel.js # Configure channel
│   │   └── bigDawg.js      # Special command
│   ├── crons/              # Scheduled tasks
│   │   ├── leaderboardUpdateCron.js # Reset statistics
│   │   └── leaderboardPostCron.js   # Post leaderboards
│   ├── functions/
│   │   └── handleCommands.js # Dynamic command loading
│   ├── util/               # Helper functions
│   │   ├── apiHandler.js   # Roblox API integration
│   │   ├── updateClanInfo.js # Update clan information
│   │   └── leaderboardUtils.js # Leaderboard utilities
│   ├── data/               # Data files (NOT in repository)
│   │   ├── playerData.json # Player data and win baselines
│   │   └── clans.json      # Clan information
│   └── index.js            # Main bot file
├── .env                    # Environment variables (NOT in repository)
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Data Files

### `playerData.json`
Stores information about linked players:
```json
{
  "players": {
    "discord_id_123": {
      "robloxId": "roblox_id_456",
      "clanId": 789,
      "dailyBaseline": 1250,
      "weeklyBaseline": 8900
    }
  }
}
```

### `clans.json`
Stores clan information:
```json
{
  "clans": {
    "789": {
      "clanName": "House of Cards",
      "clanTag": "[HoC]",
      "weeklyWinGoal": 500,
      "leaderboardChannelId": "discord_channel_id",
      "winsOffset": 0
    }
  }
}
```

## Dependencies

- **discord.js** (^14.25.1) - Discord API wrapper
- **@discordjs/rest** (^2.6.0) - REST API for Discord
- **axios** (^1.13.2) - HTTP client for Roblox API
- **dotenv** (^17.2.3) - Environment variable management
- **node-cron** (^4.2.1) - Task scheduling
- **chalk** (^5.6.2) - Console log coloring
- **dayjs** (^1.11.19) - Date manipulation
- **fs-extra** (^11.3.2) - Extended file operations

## API

The bot uses Roblox API for:
- Fetching player information (ID, wins)
- Fetching Roblox usernames
- Fetching clan information
- Verifying clan owners

## Security

- ⚠️ **NEVER** commit the `.env` file to the repository
- ⚠️ **NEVER** share your Discord Bot Token
- ⚠️ Files `playerData.json` and `clans.json` are in `.gitignore` (contain sensitive data)
- ✅ Bot uses ephemeral replies for sensitive commands
- ✅ Clan owner permissions verified via Roblox API

## Development

### Adding New Commands

1. Create a new file in `src/commands/`
2. Use this template:

```javascript
module.exports = {
    name: "commandname",
    description: "Command description",
    options: [
        // Discord slash command options
    ],
    run: async (client, interaction) => {
        // Command logic
    }
};
```

3. The bot will automatically load the command on startup

### Deploying Commands

Run the deployment script to register commands:
```bash
node src/util/deployCommands.js
```

## Troubleshooting

### Bot won't start
- Check if `.env` file exists and contains a valid token
- Check if Node.js is installed: `node --version`
- Check console logs for errors

### Commands not working
- Make sure commands are deployed: `node src/util/deployCommands.js`
- Check bot permissions on Discord server

### Leaderboards not posting
- Check if channel is set: `/setchannel`
- Check bot permissions in channel (Send Messages, Embed Links)
- Check cron logs in console

### API errors
- Bot uses rate limiting (100ms between requests)
- Check if Roblox API is available
- Verify Roblox ID validity

## Support

If you encounter issues:
1. Check the Troubleshooting section
2. Check console logs for errors
3. Make sure all dependencies are installed

## License

ISC

## Authors

Project created for the Roblox CS community.

---

**Made with ❤️ for the CS Roblox community**
