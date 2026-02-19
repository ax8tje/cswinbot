const axios = require('axios');

module.exports = {
    name: "translate",
    description: "Translate text from English to Polish",
    options: [
        {
            name: "text",
            description: "The English text to translate",
            type: 3, // STRING
            required: true
        },
        {
            name: "reply_to",
            description: "Paste the message link you're replying to",
            type: 3, // STRING
            required: false
        }
    ],
    run: async (client, interaction) => {
        const text = interaction.options.getString("text");
        const replyTo = interaction.options.getString("reply_to");

        await interaction.deferReply({ ephemeral: true });

        const skipped = [];
        const textToTranslate = text.replace(/\[([^\]]*)\]/g, (_, inner) => {
            skipped.push(inner);
            return `SKIP${skipped.length - 1}SKIP`;
        });

        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            new URLSearchParams({
                text: textToTranslate,
                source_lang: "EN",
                target_lang: "PL"
            }),
            {
                headers: {
                    Authorization: `DeepL-Auth-Key ${process.env.DEEPL_KEY}`
                }
            }
        );

        const translated = response.data.translations[0].text
            .replace(/SKIP(\d+)SKIP/g, (_, i) => skipped[parseInt(i)]);

        const webhooks = await interaction.channel.fetchWebhooks();
        let webhook = webhooks.find(wh => wh.owner?.id === client.user.id);

        if (!webhook) {
            webhook = await interaction.channel.createWebhook({ name: "Translate" });
        }

        const messageId = replyTo ? replyTo.split("/").pop() : null;

        await webhook.send({
            content: `${translated}\n-# ${text.replace(/\[([^\]]*)\]/g, '$1')}`,
            username: interaction.member.displayName,
            avatarURL: interaction.user.displayAvatarURL(),
            ...(messageId && { reply: { messageReference: messageId } })
        });

        await interaction.deleteReply();
    }
};
