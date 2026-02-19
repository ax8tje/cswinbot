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
        },
        {
            name: "reference",
            description: "Upload a reference image",
            type: 11, // ATTACHMENT
            required: false
        }
    ],
    run: async (client, interaction) => {
        const prompt = interaction.options.getString("prompt");
        const reference = interaction.options.getAttachment("reference");

        await interaction.deferReply();

        const refParam = reference ? `&image=${encodeURIComponent(reference.url)}` : "";
        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&key=${process.env.POLLINATIONS_KEY}${refParam}`;

        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(imageResponse.data);

        await interaction.editReply({
            files: [{ attachment: buffer, name: "image.jpg" }]
        });
    }
};
