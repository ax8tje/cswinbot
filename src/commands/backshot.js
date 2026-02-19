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

        const gifs = [
            "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHZ5NXRoYWhmang3bXpzNXhvMzZteGxjdGN4MzJiaHg5bmtzbjFkOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IsIyvk7zftw4H2C1Kz/giphy.gif",
            "https://i.redd.it/qmsk5v38jvtf1.gif",
            "https://i.redd.it/rn2a2bpo7pye1.gif",
            "https://media1.tenor.com/m/WjTqxzRwYNwAAAAd/gojo-satoru.gif",
            "https://media1.tenor.com/m/EEWfrljBQr0AAAAd/spongebob-backshots.gif",
            "https://i.makeagif.com/media/9-27-2024/VMGrRN.gif"
        ];
        const gifUrl = gifs[Math.floor(Math.random() * gifs.length)];

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

        const replied = new Set();

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === "backshot_accept" || i.customId === "backshot_reject",
            time: 30000
        });

        collector.on("collect", async i => {
            if (i.user.id !== target.id) {
                if (replied.has(i.user.id)) return await i.deferUpdate();
                replied.add(i.user.id);
                if (i.customId === "backshot_accept") {
                    await i.reply({ content: "u wish 💀", ephemeral: true });
                } else {
                    await i.reply({ content: "this ain't about you bro 💀", ephemeral: true });
                }
                return;
            }

            collector.stop("responded");

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
