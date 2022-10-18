const { workerData } = require('worker_threads');
const needle = require('needle');
const proxyAgent = require('proxy-agent');
const randomUserAgent = require('random-useragent');

async function start() {
    return new Promise((resolve) => {

        try {
            needle('get', 'https://id.twitch.tv/oauth2/validate', {
                headers: {
                    'User-Agent': randomUserAgent.getRandom(),
                    'Authorization': "OAuth " + workerData.token
                },
                agent: proxyAgent("http://"+workerData.proxies[Math.floor(Math.random() * workerData.proxies.length)])
            }).then((result) => {
                if (result.body.login) {
                    process.exit(1);
                } else {
                    process.exit(0);
                }
            }).catch((err) => {
                process.exit(2);
            });
        } catch (e) {
            process.exit(2);
        }

    });
}

start();