const inquirer = require('inquirer');
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-selector-prompt'));

const fs = require('fs');
const { Worker } = require('worker_threads');

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

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
    },
    {
        type: 'input',
        name: "threads",
        message: 'Choose how many threads you want to use ',
        default: 8
    }
];

async function start() {
    inquirer.prompt(questions).then(async answers => {
        let tokens = fs.readFileSync(answers.tokens, 'utf-8').split('\r\n');
        let proxies = fs.readFileSync(answers.proxies, 'utf-8').split('\r\n');
        let delay = answers.delay;
        let threads = answers.threads;

        let checkedTokens = 0;

        let runningThreads = 0;
        while (checkedTokens < tokens.length) {
            await wait(delay);
            if (runningThreads >= threads)
                continue;

            let token = tokens.shift();

            let worker = new Worker('./worker.js', {
                workerData: {
                    token: token,
                    proxies: proxies
                }
            });

            worker.on('exit', (code) => {
                if (code == 1) {
                    console.log(token + " is valid");
                    fs.writeFileSync('valid.txt', token + '\r\n', { flag: 'a+' });
                } else if (code == 0) {
                    console.log(token + " is invalid");
                    fs.writeFileSync('invalid.txt', token + '\r\n', { flag: 'a+' });
                } else {
                    console.log(token + " errored");
                    fs.writeFileSync('errored.txt', token + '\r\n', { flag: 'a+' });
                }
                runningThreads--;
            });

            checkedTokens++;

            if (checkedTokens >= tokens.length) {
                console.log("Finished checking all tokens");
                break;
            }
        }

    });
}

start();