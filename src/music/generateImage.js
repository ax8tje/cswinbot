const { createCanvas } = require('@napi-rs/canvas');
const GifEncoder = require('gif-encoder-2');

const COLOR = '#bf5fff';
const COLOR_DIM = 'rgba(191, 95, 255, 0.3)';
const COLOR_MID = 'rgba(191, 95, 255, 0.5)';
const COLOR_STATUS = 'rgba(191, 95, 255, 0.55)';
const COLOR_TAG = 'rgba(191, 95, 255, 0.3)';

function drawFrame(ctx, songName, showCursor, width, height) {
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // CRT scanlines
    for (let y = 0; y < height; y += 4) {
        ctx.fillStyle = 'rgba(191, 95, 255, 0.04)';
        ctx.fillRect(0, y, width, 2);
    }

    // Outer border glow
    ctx.shadowColor = COLOR;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    // Inner border
    ctx.strokeStyle = COLOR_DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // "NOW PLAYING" label
    ctx.font = 'bold 16px "Courier New"';
    ctx.fillStyle = COLOR_MID;
    ctx.fillText('> NOW PLAYING', 55, 72);

    // Separator
    ctx.fillStyle = COLOR_DIM;
    ctx.fillRect(55, 83, width - 110, 1);

    // Song name — auto-scale font size to fit
    const cleanName = songName.replace(/\.(mp3|wav|flac)$/i, '');
    let fontSize = 36;
    ctx.font = `bold ${fontSize}px "Courier New"`;

    while (ctx.measureText(`> ${cleanName}`).width > width - 130 && fontSize > 18) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px "Courier New"`;
    }

    // If still too wide after scaling, truncate
    let displayName = cleanName;
    while (ctx.measureText(`> ${displayName}...`).width > width - 130 && displayName.length > 5) {
        displayName = displayName.slice(0, -1);
    }
    if (displayName !== cleanName) displayName += '...';

    ctx.fillStyle = COLOR;
    ctx.shadowColor = COLOR;
    ctx.shadowBlur = 14;
    ctx.fillText(`> ${displayName}`, 55, 165);
    ctx.shadowBlur = 0;

    // Blinking cursor
    if (showCursor) {
        ctx.fillStyle = COLOR;
        ctx.shadowColor = COLOR;
        ctx.shadowBlur = 8;
        ctx.fillRect(55, 178, 16, 3);
        ctx.shadowBlur = 0;
    }

    // Separator
    ctx.fillStyle = COLOR_DIM;
    ctx.fillRect(55, 200, width - 110, 1);

    // Status bar
    ctx.font = '14px "Courier New"';
    ctx.fillStyle = COLOR_STATUS;
    ctx.fillText('STATUS: PLAYING  |  MODE: SHUFFLE', 55, 232);

    // Bottom right tag
    ctx.font = '12px "Courier New"';
    ctx.fillStyle = COLOR_TAG;
    ctx.fillText('CSBOT v1.0', width - 120, height - 28);
}

function generateNowPlayingGif(songName) {
    const width = 950;
    const height = 290;

    const encoder = new GifEncoder(width, height);
    encoder.setDelay(500);
    encoder.setRepeat(0);
    encoder.start();

    for (let i = 0; i < 2; i++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        drawFrame(ctx, songName, i === 0, width, height);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    return encoder.out.getData();
}

module.exports = { generateNowPlayingGif };
