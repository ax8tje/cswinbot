const axios = require('axios');

module.exports = {
    name: "imagine",
    description: "Generate an image from a prompt",
    options: [
        {
            name: "prompt",
            description: "Describe the image you want to generate",
            type: 3, // STRING
            required: true
        }
    ],
    run: async (client, interaction) => {
        const prompt = interaction.options.getString("prompt");

        await interaction.deferReply();

        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=imagen-4&key=${process.env.POLLINATIONS_KEY}`;

        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(imageResponse.data);

        await interaction.editReply({
            files: [{ attachment: buffer, name: "image.jpg" }]
        });
    }
};
