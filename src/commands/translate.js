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
        }
    ],
    run: async (client, interaction) => {
        const text = interaction.options.getString("text");

        await interaction.deferReply({ ephemeral: true });

        const textToTranslate = text.replace(/\[([^\]]*)\]/g, (_, inner) => `<keep>${inner}</keep>`);

        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            new URLSearchParams({
                text: textToTranslate,
                source_lang: "EN",
                target_lang: "PL",
                tag_handling: "xml",
                ignore_tags: "keep"
            }),
            {
                headers: {
                    Authorization: `DeepL-Auth-Key ${process.env.DEEPL_KEY}`
                }
            }
        );

        const translated = response.data.translations[0].text
            .replace(/<keep>(.*?)<\/keep>/g, '$1');

        const webhooks = await interaction.channel.fetchWebhooks();
        let webhook = webhooks.find(wh => wh.owner?.id === client.user.id);

        if (!webhook) {
            webhook = await interaction.channel.createWebhook({ name: "Translate" });
        }

        await webhook.send({
            content: `${translated}\n-# ${text}`,
            username: interaction.member.displayName,
            avatarURL: interaction.user.displayAvatarURL()
        });

        await interaction.deleteReply();
    }
};
