const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "kiss",
    description: "Send a kiss to someone",
    options: [
        {
            name: "user",
            description: "Who do you want to kiss?",
            type: 6, // USER
            required: true
        }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser("user");

        if (target.id === interaction.user.id) {
            return interaction.reply({ content: "You can't kiss yourself...", ephemeral: true });
        }

        const gifRes = await axios.get("https://api.waifu.pics/sfw/kiss");
        const gifUrl = gifRes.data.url;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("kiss_accept")
                .setLabel("Accept 💋")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("kiss_reject")
                .setLabel("Reject 🙅")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            content: `${gifUrl}\n💋 **${interaction.member.displayName}** wants to kiss **${interaction.guild.members.cache.get(target.id)?.displayName ?? target.username}**!\n\n<@${target.id}>, do you accept?`,
            components: [row]
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === target.id && (i.customId === "kiss_accept" || i.customId === "kiss_reject"),
            time: 30000,
            max: 1
        });

        collector.on("collect", async i => {
            const kisser = interaction.member.displayName;
            const kissed = i.member.displayName;

            if (i.customId === "kiss_accept") {
                await i.update({ content: `${gifUrl}\n💋 **${kissed}** accepted the kiss from **${kisser}**! 😘`, components: [] });
            } else {
                await i.update({ content: `🙅 **${kissed}** rejected the kiss from **${kisser}**... 💔`, components: [] });
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
                await interaction.editReply({ content: `⏰ **${interaction.guild.members.cache.get(target.id)?.displayName ?? target.username}** didn't respond to the kiss from **${interaction.member.displayName}**...`, components: [] });
            }
        });
    }
};
