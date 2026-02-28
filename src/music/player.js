const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateNowPlayingGif } = require('./generateImage');
const fs = require('fs');
const path = require('path');

// State
let queue = [];
let history = [];
let currentSong = null;
let audioPlayer = null;
let voiceConnection = null;
let musicChannel = null;
let currentMessage = null;
let isPaused = false;

function loadSongs() {
    const songsFolder = process.env.MUSIC_FOLDER;
    const files = fs.readdirSync(songsFolder);
    const songs = files.filter(f => /\.(mp3|wav|flac)$/i.test(f));

    for (let i = songs.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    return songs;
}

function buildButtons(paused = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_prev').setLabel('⏮').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_pause').setLabel(paused ? '▶️' : '⏸').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_next').setLabel('⏭').setStyle(ButtonStyle.Secondary)
    );
}

async function updateMessage(songFile) {
    const songName = songFile.replace(/\.(mp3|wav|flac)$/i, '');
    const imageBuffer = generateNowPlayingGif(songName);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.gif' });
    const buttons = buildButtons(isPaused);

    const lastMessage = (await musicChannel.messages.fetch({ limit: 1 })).first();
    const isLast = lastMessage && currentMessage && lastMessage.id === currentMessage.id;

    if (currentMessage && isLast) {
        await currentMessage.edit({ files: [attachment], components: [buttons] });
    } else {
        if (currentMessage) await currentMessage.delete().catch(() => {});
        currentMessage = await musicChannel.send({ files: [attachment], components: [buttons] });
    }
}

async function playSong(songFile) {
    currentSong = songFile;
    const resource = createAudioResource(path.join(process.env.MUSIC_FOLDER, songFile));
    audioPlayer.play(resource);
    await updateMessage(songFile);
    console.log(`Playing: ${songFile}`);
}

async function playNext() {
    if (currentSong) history.push(currentSong);
    if (queue.length === 0) {
        queue = loadSongs();
        if (queue.length > 1 && queue[0] === currentSong) {
            [queue[0], queue[1]] = [queue[1], queue[0]];
        }
    }
    await playSong(queue.shift());
}

async function playPrev() {
    if (history.length === 0) {
        await playSong(currentSong); // restart current if no history
        return;
    }
    if (currentSong) queue.unshift(currentSong);
    await playSong(history.pop());
}

async function togglePause() {
    if (isPaused) {
        audioPlayer.unpause();
        isPaused = false;
    } else {
        audioPlayer.pause();
        isPaused = true;
    }

    if (currentMessage) {
        await currentMessage.edit({ components: [buildButtons(isPaused)] });
    }
}

async function startMusic(client, interaction) {
    const channel = interaction.member.voice.channel;

    if (!channel) {
        return interaction.reply({ content: 'U gotta be in a voice channel mud...', flags: 64 });
    }

    voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    audioPlayer = createAudioPlayer();
    voiceConnection.subscribe(audioPlayer);

    musicChannel = await client.channels.fetch(process.env.MUSIC_TEXT_CHANNEL_ID);
    queue = loadSongs();

    // Auto-next when song ends — loops forever
    audioPlayer.on(AudioPlayerStatus.Idle, async () => {
        await playNext();
    });

    await playNext();
    await interaction.editReply({ content: '✅', flags: 64 });
}

module.exports = { startMusic, playNext, playPrev, togglePause };
