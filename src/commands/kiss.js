const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

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
        const targetMember = interaction.guild.members.cache.get(target.id);

        if (target.id === interaction.user.id) {
            return interaction.reply({ content: "You can't kiss yourself...", ephemeral: true });
        }

        const gifRes = await axios.get("https://api.waifu.pics/sfw/kiss");
        const gifUrl = gifRes.data.url;

        const kisser = interaction.member.displayName;
        const kissed = targetMember?.displayName ?? target.username;

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

        const embed = new EmbedBuilder()
            .setColor(0xff69b4)
            .setDescription(`💋 **${kisser}** wants to kiss **${kissed}**!\n\n<@${target.id}>, do you accept?`)
            .setImage(gifUrl);

        await interaction.reply({ embeds: [embed], components: [row] });

        const replied = new Set();

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === "kiss_accept" || i.customId === "kiss_reject",
            time: 30000
        });

        collector.on("collect", async i => {
            if (i.user.id !== target.id) {
                if (replied.has(i.user.id)) return await i.deferUpdate();
                replied.add(i.user.id);
                if (i.customId === "kiss_accept") {
                    await i.reply({ content: "u wish 💀", ephemeral: true });
                } else {
                    await i.reply({ content: "this ain't about you bro 💀", ephemeral: true });
                }
                return;
            }

            collector.stop("responded");

            if (i.customId === "kiss_accept") {
                const acceptEmbed = new EmbedBuilder()
                    .setColor(0xff69b4)
                    .setDescription(`💋 **${i.member.displayName}** accepted the kiss from **${kisser}**! 😘`)
                    .setImage(gifUrl);
                await i.update({ embeds: [acceptEmbed], components: [] });
            } else {
                const rejectEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setDescription(`🙅 **${i.member.displayName}** rejected the kiss from **${kisser}**... 💔`);
                await i.update({ embeds: [rejectEmbed], components: [] });
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setDescription(`⏰ **${kissed}** didn't respond to the kiss from **${kisser}**...`);
                await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
