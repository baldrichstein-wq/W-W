// Brücke zwischen Konsole und Browser-UI
const logPanel = document.getElementById('game-log');
const inputQuery = document.getElementById('input-query');
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');

// Umleitung von console.log in das Game Log Panel
const originalLog = console.log;
console.log = (...args) => {
    originalLog(...args);
    const p = document.createElement('p');
    p.innerHTML = args.join(' ');
    p.classList.add('log-entry');
    logPanel.appendChild(p);
    logPanel.scrollTop = logPanel.scrollHeight;
};

export async function printSlow(text) {
    console.log(text);
    return new Promise(resolve => setTimeout(resolve, 300));
}

export function question(text) {
    return new Promise((resolve) => {
        inputQuery.textContent = text;
        userInput.disabled = false;
        submitBtn.disabled = false;
        userInput.value = '';
        userInput.focus();

        const handleInput = () => {
            const val = userInput.value;
            userInput.disabled = true;
            submitBtn.disabled = true;
            submitBtn.removeEventListener('click', handleInput);
            userInput.removeEventListener('keypress', handleKey);
            resolve(val);
        };

        const handleKey = (e) => {
            if (e.key === 'Enter') handleInput();
        };

        submitBtn.addEventListener('click', handleInput);
        userInput.addEventListener('keypress', handleKey);
    });
}

export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function wuerfelD20() {
    return randomRange(1, 20);
}