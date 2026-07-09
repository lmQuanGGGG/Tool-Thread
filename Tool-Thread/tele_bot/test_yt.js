const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

async function testDownload() {
    console.log("Testing ytdl-core...");
    try {
        const url = 'https://www.youtube.com/watch?v=3wNZWNzHKIg';
        const stream = ytdl(url, { quality: 'highestvideo' });
        stream.pipe(fs.createWriteStream('test_video.mp4'));
        stream.on('end', () => console.log('Download complete!'));
        stream.on('error', (err) => console.error('Error:', err.message));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testDownload();
