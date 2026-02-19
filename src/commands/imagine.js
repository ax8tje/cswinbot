const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename, contentType: 'image/png' });

    const res = await axios.post('https://catbox.moe/user.php', form, {
        headers: form.getHeaders()
    });

    return res.data.trim(); // returns public URL
}

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
            description: "Upload a reference image to edit",
            type: 11, // ATTACHMENT
            required: false
        }
    ],
    run: async (client, interaction) => {
        const prompt = interaction.options.getString("prompt");
        const reference = interaction.options.getAttachment("reference");

        await interaction.deferReply();

        let refParam = "";
        if (reference) {
            const discordImage = await axios.get(reference.url, { responseType: "arraybuffer" });
            const publicUrl = await uploadToCatbox(Buffer.from(discordImage.data), reference.name);
            refParam = `&image=${encodeURIComponent(publicUrl)}`;
        }

        const model = reference ? "flux" : "flux";
        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&key=${process.env.POLLINATIONS_KEY}${refParam}`;

        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(imageResponse.data);

        await interaction.editReply({
            files: [{ attachment: buffer, name: "image.jpg" }]
        });
    }
};
