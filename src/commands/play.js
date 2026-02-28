const { startMusic } = require('../music/player');
const allowedUsers = require('../music/allowedUsers');

module.exports = {
    name: 'play',
    description: 'Shuffled unreleased HOC Novas songs',
    run: async (client, interaction) => {
        if (!allowedUsers.includes(interaction.user.id)){
            return interaction.reply({content: 'You cant use that dumahh😭', flags: 64});
        }
        await interaction.deferReply({ flags: 64 });
        await startMusic(client, interaction);
    }
};