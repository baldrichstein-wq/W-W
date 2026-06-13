const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function printSlow(text) {
    for (const char of text) {
        process.stdout.write(char);
        await sleep(15);
    }
    console.log();
}

function wuerfelD20() {
    return randomRange(1, 20);
}
function wuerfelD6() {
    return randomRange(1, 6);
}


module.exports = {
    rl,
    question,
    randomRange,
    printSlow,
    wuerfelD20,
    wuerfelD6
};