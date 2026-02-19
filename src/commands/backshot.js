const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: "backshot",
    description: "Give someone a backshot",
    options: [
        {
            name: "user",
            description: "Who do you want to backshot?",
            type: 6, // USER
            required: true
        }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser("user");
        const targetMember = interaction.guild.members.cache.get(target.id);

        if (target.id === interaction.user.id) {
            return interaction.reply({ content: "You can't backshot yourself...", ephemeral: true });
        }

        const gifRes = await axios.get("https://api.giphy.com/v1/gifs/search", {
            params: { api_key: process.env.GIPHY_KEY, q: "backshot", limit: 50, rating: "r" }
        });
        const results = gifRes.data.data;
        const gif = results[Math.floor(Math.random() * results.length)];
        const gifUrl = gif.images.original.url;

        const sender = interaction.member.displayName;
        const receiver = targetMember?.displayName ?? target.username;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("backshot_accept")
                .setLabel("Accept 🍑")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("backshot_reject")
                .setLabel("Reject 🙅")
                .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
            .setColor(0xff4500)
            .setDescription(`🍑 **${sender}** wants to give **${receiver}** a backshot!\n\n<@${target.id}>, do you accept?`)
            .setImage(gifUrl);

        await interaction.reply({ embeds: [embed], components: [row] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === target.id && (i.customId === "backshot_accept" || i.customId === "backshot_reject"),
            time: 30000,
            max: 1
        });

        collector.on("collect", async i => {
            if (i.customId === "backshot_accept") {
                const acceptEmbed = new EmbedBuilder()
                    .setColor(0xff4500)
                    .setDescription(`🍑 **${i.member.displayName}** accepted the backshot from **${sender}**! 🔥`)
                    .setImage(gifUrl);
                await i.update({ embeds: [acceptEmbed], components: [] });
            } else {
                const rejectEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setDescription(`🙅 **${i.member.displayName}** rejected the backshot from **${sender}**... 💔`);
                await i.update({ embeds: [rejectEmbed], components: [] });
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setDescription(`⏰ **${receiver}** didn't respond to **${sender}**...`);
                await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
