const inquirer = require('inquirer');
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-selector-prompt'));

const fs = require('fs');
const needle = require('needle');
const proxyAgent = require('proxy-agent');
const randomUserAgent = require('random-useragent');

const questions = [
    {
        type: 'file-tree-selection',
        name: "tokens",
        message: 'Choose token file ',
        extensions: ['txt'],
        default: './tokens.txt',
    },
    {
        type: 'file-tree-selection',
        name: "proxies",
        message: 'Choose proxy file ',
        extensions: ['txt'],
        default: './proxies.txt',
    },
    {
        type: 'input',
        name: "delay",
        message: 'Choose delay between requests (ms) ',
        default: 1000
    }
];

inquirer.prompt(questions).then(answers => {
    let tokens = fs.readFileSync(answers.tokens, 'utf-8').split('\r\n');
    let proxies = fs.readFileSync(answers.proxies, 'utf-8').split('\r\n');
    let delay = answers.delay;

    let i = 0;
    let interval = setInterval(() => {
        if (i >= tokens.length) {
            clearInterval(interval);
            return;
        }

        let token = tokens[i];
        let proxy = proxies[Math.floor(Math.random() * proxies.length)];

        needle('get', 'https://id.twitch.tv/oauth2/validate', {
            headers: {
                'User-Agent': randomUserAgent.getRandom(),
                'Authorization': "OAuth " + token
            },
            agent: proxyAgent("http://"+proxy)
        }).then((res) => {
            if (res.body.client_id === "kimne78kx3ncx6brgo4mv6wki5h1ko") {
                console.log('Token ' + token + ' is valid!');
                fs.writeFileSync('valid.txt', res.body.login + ':' + res.body.user_id + ':' + token + '\r\n', { flag: 'a' });
            } else {
                console.log('Token ' + token + ' is invalid!');
                fs.writeFileSync('error.txt', token + '\r\n', { flag: 'a' });
            }
        });

        i++;
    }, delay);
});