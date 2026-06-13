// Brücke zwischen Konsole und Browser-UI
const logContainer = document.getElementById('log-panel');
const logContent = document.getElementById('game-log');
const inputQuery = document.getElementById('input-query');
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const criticalHpSound = document.getElementById('critical-hp-sound');

// Umleitung von console.log in das Game Log Panel
const originalLog = console.log;
console.log = (...args) => {
    originalLog(...args);
    const p = document.createElement('p');
    p.innerHTML = args.join(' ');
    p.classList.add('log-entry');
    logContent.appendChild(p);
    logContainer.scrollTop = logContainer.scrollHeight;
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

export function updateUI(helden, monster = null, monsterStatus = null) {
    helden.forEach((h, i) => {
        const card = document.getElementById(`player${i+1}-card`);
        const statusDiv = document.getElementById(`p${i+1}-status`);
        
        if (statusDiv && card) {
            const materialien = h.inventar.filter(item => item.typ === "Material");
            const sonstigeItems = h.inventar.filter(item => item.typ !== "Material");

            const materialListe = materialien.length > 0 
                ? materialien.map(m => `<span class="inventory-material">${m.name}</span>`).join(", ") 
                : "keine";
            
            const inventarListe = sonstigeItems.length > 0 ? sonstigeItems.map(item => item.name).join(", ") : "leer";
            
            const questListe = h.activeQuests.length > 0 
                ? h.activeQuests.map(q => q.title).join(", ") 
                : "keine";

            const ausruestung = [
                h.ausgeruestete_waffe?.name,
                h.ausgeruestete_ruestung?.name,
                h.ausgeruestete_schild?.name
            ].filter(Boolean).join(", ") || "keine";

            const hpPercent = Math.max(0, Math.min(100, (h.hp / h.max_hp) * 100));
            const apPercent = Math.max(0, Math.min(100, (h.ap / h.max_ap) * 100));
            const spPercent = Math.max(0, Math.min(100, (h.sp / h.max_sp) * 100));

            if (hpPercent < 20 && h.hp > 0) {
                card.classList.add('critical-hp');
                if (!h.isCriticalHpSoundPlayed) {
                    if (criticalHpSound) {
                        criticalHpSound.currentTime = 0;
                        criticalHpSound.play().catch(() => {}); // Catch falls Browser Autoplay blockt
                    }
                    h.isCriticalHpSoundPlayed = true;
                }
            } else {
                card.classList.remove('critical-hp');
                h.isCriticalHpSoundPlayed = false;
            }

            statusDiv.innerHTML = `
                <strong>${h.name}</strong> (${h.klasse})<br>
                💰 Gold: ${h.gold}<br>
                <div class="bar-container">
                    <small>❤️ HP: ${h.hp}/${h.max_hp}</small>
                    <div class="progress-bar"><div class="progress-fill hp-fill" style="width: ${hpPercent}%"></div></div>
                </div>
                <div class="bar-container">
                    <small>✨ AP: ${h.ap}/${h.max_ap}</small>
                    <div class="progress-bar"><div class="progress-fill ap-fill" style="width: ${apPercent}%"></div></div>
                </div>
                <div class="bar-container">
                    <small>⚡ SP (Ultimate): ${h.sp}/${h.max_sp}</small>
                    <div class="progress-bar"><div class="progress-fill sp-fill" style="width: ${spPercent}%"></div></div>
                </div>
                🛡️ RK: ${h.ruestung_klasse()}<br>
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 5px 0;">
                <div style="font-size: 0.85em;">
                    <strong>Ausrüstung:</strong> ${ausruestung}<br>
                    <strong>Gegenstände:</strong> ${inventarListe}<br>
                    <strong>Materialien:</strong> ${materialListe}<br>
                    <strong>Quests:</strong> ${questListe}
                </div>
            `;
        }
    });

    const monsterUi = document.getElementById('monster-ui');
    const monsterStatsDiv = document.getElementById('monster-stats-ui');
    const monsterNameDiv = document.getElementById('monster-name-ui');

    if (monsterUi && monster && monster.hp > 0) {
        monsterUi.style.display = 'block';
        monsterNameDiv.textContent = `👾 ${monster.name}`;
        const monsterHpPercent = Math.max(0, Math.min(100, (monster.hp / monster.max_hp) * 100));
        const damageText = monster.lastDmg > 0 ? `<span class="effect-lifesteal"> (-${monster.lastDmg})</span>` : "";

        monsterStatsDiv.innerHTML = `
            <div class="bar-container">
                <small>❤️ HP: ${monster.hp}/${monster.max_hp}${damageText}</small>
                <div class="progress-bar"><div class="progress-fill hp-fill" style="width: ${monsterHpPercent}%"></div></div>
            </div>
        `;
    } else if (monsterUi) {
        monsterUi.style.display = 'none';
    }
}