const axios = require('axios');

async function testCobalt() {
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: 'https://www.youtube.com/watch?v=aj38LViraNc',
            vCodec: 'h264',
            vQuality: '1080',
            aFormat: 'mp3',
            filenamePattern: 'nerd'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
testCobalt();
