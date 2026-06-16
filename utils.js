import { hofnarr } from './story.js';
import { translations } from './translations.js';
// Brücke zwischen Konsole und Browser-UI
// Umleitung von console.log in das Game Log Panel
const originalLog = console.log;
console.log = (...args) => { // This override is for general console.log calls, not for printSlow
    originalLog(...args); // Log to the actual browser console
    const logContent = document.getElementById('game-log');
    const logContainer = document.getElementById('log-panel');
    if (!logContent || !logContainer) return;

    const p = document.createElement('p');
    p.innerHTML = args.join(' ');
    p.classList.add('log-entry');
    // No special class handling here, printSlow will handle its own elements
    logContent.appendChild(p);
    logContainer.scrollTop = logContainer.scrollHeight;
};

export let config = {
    textSpeed: 300,
    goldAnimations: true,
    brightness: 25, // Standardwert für den Helligkeits-Slider
    language: 'de'
};

// Funktion zum Laden der Konfiguration aus dem localStorage
function loadConfigFromLocalStorage() {
    try {
        const storedConfig = localStorage.getItem('game_settings');
        if (storedConfig) {
            const parsedConfig = JSON.parse(storedConfig);
            // Bestehende Konfiguration mit geladenen Werten überschreiben/ergänzen
            config = { ...config, ...parsedConfig };
        }
    } catch (e) {
        console.error("Fehler beim Laden der Einstellungen aus localStorage:", e);
    }
}

// Funktion zum Speichern der Konfiguration im localStorage
export function saveConfigToLocalStorage() {
    localStorage.setItem('game_settings', JSON.stringify(config));
}

// Konfiguration sofort beim Laden des Moduls laden
loadConfigFromLocalStorage();

export function t(key) {
    const lang = config.language || 'de';
    return translations[lang]?.[key] || translations['de']?.[key] || key;
}

export async function printSlow(text, className = null) {
    const logContent = document.getElementById('game-log');
    const p = document.createElement('p');
    p.innerHTML = text;
    p.classList.add('log-entry');
    if (className) p.classList.add(className);
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
    return new Promise(resolve => setTimeout(resolve, config.textSpeed));
}

export function formatAbilityDesc(ab, held = null) {
    let parts = [];
    let displayedDmg = ab.schaden;

    // Sonderlogik für Schildschlag/Schildstoß (RK + ATK)
    if (held && (ab.name === "Schildschlag" || ab.name === "Schildstoß")) {
        displayedDmg = held.ruestung_klasse() + held.atk_bonus;
    }

    // Sonderlogik für Präzisionsschlag (Skalierung anzeigen)
    if (held && ab.name === "Präzisionsschlag") {
        displayedDmg = `${ab.schaden + (held.grund_gesch * 2)} (GES-Bonus inkl.)`;
    }

    // Sonderlogik für Waffengewalt (Skalierung anzeigen)
    if (held && ab.name === "Waffengewalt") {
        displayedDmg = `${ab.schaden + (held.atk_bonus * 3)} (STR-Bonus inkl.)`;
    }

    // Sonderlogik für Arkane Überladung (Skalierung anzeigen)
    if (held && ab.name === "Arkane Überladung") {
        displayedDmg = `${ab.schaden + (held.grund_int * 4)} (INT-Bonus inkl.)`;
    }

    if (displayedDmg) parts.push(`💥 ${displayedDmg} ${t('stat_dmg')}`);
    if (ab.element) parts.push(`[${ab.element}]`);
    if (ab.heilung) parts.push(`💚 ${ab.heilung} ${t('hp')}`);
    if (ab.atk_buff) parts.push(`⚔️ ${ab.atk_buff > 0 ? '+' : ''}${ab.atk_buff} ${t('atk')}`);
    if (ab.def_buff) parts.push(`🛡️ ${ab.def_buff > 0 ? '+' : ''}${ab.def_buff} ${t('rk')}`);
    if (ab.schlaf_dauer) parts.push(`💤 ${t('stat_sleep')} (${ab.schlaf_dauer} ${t('stat_rounds')})`);
    if (ab.verwirrt) parts.push(`🌀 ${t('stat_confused')} (${ab.verwirrt} ${t('stat_rounds')})`);
    if (ab.niederhalten) parts.push(`⛓️ ${t('stat_immobilized')} (${ab.niederhalten} ${t('stat_rounds')})`);
    if (ab.execute_threshold) parts.push(`💀 ${t('stat_kill')} < ${ab.execute_threshold}%`);
    if (ab.ap_regen) parts.push(`✨ +${ab.ap_regen} ${t('ap')}`);
    if (ab.hp_kosten) parts.push(`🩸 -${ab.hp_kosten} ${t('hp')}`);
    if (ab.belebt) parts.push(`☀️ ${t('stat_reanimation')}`);
    if (ab.licht) parts.push(`🌟 ${t('stat_light')} (${ab.licht} ${t('stat_rounds')})`);
    if (ab.licht_atk) parts.push(`🎯 ATK: +${ab.licht_atk}`);
    if (ab.licht_def) parts.push(`🛡️ RK: +${ab.licht_def}`);
    if (ab.abschrecken) parts.push(`✨ ${t('stat_undead_flee')} (${ab.abschrecken}%)`);
    if (ab.stealth_buff) parts.push(`👤 +${ab.stealth_buff} ${t('stat_stealth')}`);
    if (ab.schaden_reduktion) parts.push(`🛡️ -${ab.schaden_reduktion} ${t('stat_dmg_reduction')}`);
    if (ab.bonus_schaden) parts.push(`⚔️ +${ab.bonus_schaden} ${t('stat_bonus_dmg')}`);
    return parts.length > 0 ? parts.join(" ") : "Spezialeffekt";
}

export function formatItemDesc(item) {
    let parts = [];
    if (item.typ === "Waffe") parts.push(`⚔️ Schaden: +${item.wert}`);
    else if (item.typ === "Ruestung") parts.push(`🛡️ Rüstungsklasse: ${item.wert}`);
    else if (item.typ === "Schild") parts.push(`🛡️ Schildwert: +${item.wert}`);
    else if (item.typ === "Gegenstand" && item.wert > 0) parts.push(`❤️ Heilung: ${item.wert} HP`);
    
    if (item.ladungen !== undefined) parts.push(`🔥 Ladungen: ${item.ladungen}`);
    
    if (item.effekt) {
        if (item.effekt.typ === "ap_regen") parts.push(`✨ AP-Regen: +${item.effekt.wert}`);
        if (item.effekt.typ === "lebensraub") parts.push(`🩸 Lebensraub: ${Math.round(item.effekt.wert * 100)}%`);
    }
    const loreText = item.lore || "Ein nützlicher Gegenstand für Abenteurer.";
    return `<div style="border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 5px; margin-bottom: 5px;">${parts.length > 0 ? parts.join("<br>") : item.typ}</div><i style="color: #aab7b8;">"${loreText}"</i>`;
}

export function question(text) {
    const inputQuery = document.getElementById('input-query');
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');

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

const rassenIcons = {
    "mensch": "👤",
    "ork": "👹",
    "zwerg": "⚒️",
    "elf": "🧝",
    "goblin": "🐸"
};

const klassenIcons = {
    "krieger": "⚔️",
    "magier": "🧙",
    "schurke": "🔪",
    "heiler": "⚕️",
    "verteidiger": "🛡️",
    "tueftler": "⚙️",
    "alchemist": "⚗️",
    "barde": "🎶",
    "paladin": "⚜️",
    "berserker": "🩸",
    "erzmagier": "🔮",
    "assassine": "🗡️"
};

export function wuerfelD20() {
    return randomRange(1, 20);
}

export function triggerGoldAnimation() {
    // Animation nur ausführen, wenn in den Einstellungen aktiviert
    if (!config.goldAnimations) return;

    const coinCount = 15;
    for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.innerHTML = '●';
        
        // Startposition in der unteren Bildschirmmitte (nahe dem Input)
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight - 100;
        
        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;
        
        // Zufällige Flugbahn
        const dx = (Math.random() - 0.5) * 800; // Links oder Rechts
        const dy = -(Math.random() * 500 + 150); // Nach oben
        
        coin.style.setProperty('--dx', `${dx}px`);
        coin.style.setProperty('--dy', `${dy}px`);
        
        const duration = 0.6 + Math.random() * 0.7;
        coin.style.animation = `coin-fly ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        
        document.body.appendChild(coin);
        setTimeout(() => coin.remove(), duration * 1000);
    }
}

let lastEbene = "-";
let lastRaum = "-";
let lastMax = "-";

const ebenenDetails = {
    1: { name: "Der flüsternde Wald", icon: "🌲" },
    2: { name: "Die verfallenen Ruinen", icon: "🏚️" },
    3: { name: "Der vergessene Friedhof", icon: "🪦" },
    4: { name: "Der modrige Sumpf", icon: "☣️" },
    5: { name: "Die giftigen Pilzwälder", icon: "🍄" },
    6: { name: "Die überfluteten Kavernen", icon: "💧" },
    7: { name: "Das endlose Labyrinth", icon: "🌀" },
    8: { name: "Die strahlenden Kristallhöhlen", icon: "💎" },
    9: { name: "Die gefrorenen Einöden", icon: "❄️" },
    10: { name: "Die brodelnden Magmaflüsse", icon: "🔥" },
    11: { name: "Die pforten der Hölle", icon: "👿" },
    12: { name: "Die himmlischen Sphären", icon: "✨" },
    13: { name: "Die absolute Dunkelheit", icon: "🌑" },
    14: { name: "Der Aufstieg zum Gipfel", icon: "🌋" },
    15: { name: "Die majestätische Burg", icon: "🏰" }
};

export function updateUI(helden, monster = null, monsterStatus = null, ebene = null, raum = null, raumAnzahl = null) {
    const criticalHpSound = document.getElementById('critical-hp-sound');
    
    if (ebene !== null) {
        lastEbene = ebene;
        lastRaum = raum;
        lastMax = raumAnzahl;
    }

    // Dungeon-Fortschritt im UI anzeigen (wird oben im Stats-Panel eingefügt)
    const statsPanel = document.getElementById('stats-panel');
    let progressDiv = document.getElementById('dungeon-progress-ui');
    if (!progressDiv && statsPanel) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'dungeon-progress-ui';
        progressDiv.className = 'player-card';
        progressDiv.style.marginBottom = '15px';
        progressDiv.style.textAlign = 'center';
        statsPanel.prepend(progressDiv);
    }
    if (progressDiv) {
        const currentR = parseInt(lastRaum);
        const maxR = parseInt(lastMax);
        let progressPercent = 0;
        
        if (!isNaN(currentR) && !isNaN(maxR) && maxR > 0) {
            progressPercent = Math.min(100, Math.round((currentR / maxR) * 100));
        } else if (lastMax === "Boss" || lastMax === "✓" || lastMax === "Abstieg") {
            progressPercent = 100;
        }
        
        const isComplete = progressPercent === 100;
        const completeClass = isComplete ? 'progress-complete' : '';

        // Calculate total completed quests
        let totalCompletedQuests = 0;
        helden.forEach(h => {
            totalCompletedQuests += h.completedQuests.length;
        });

        // Pippin UI Anzeige
        let jesterHtml = "";
        if (hofnarr.active && !hofnarr.completed && hofnarr.hp > 0) {
            const jHpPercent = (hofnarr.hp / hofnarr.max_hp) * 100;
            jesterHtml = `
                <div style="margin-top: 10px; padding: 5px; border: 1px dashed var(--accent-color); background: rgba(0,0,0,0.2);">
                    <small>🤡 Begleiter: ${hofnarr.name}</small>
                    <div class="progress-bar" style="height: 6px;">
                        <div class="progress-fill hp-fill" style="width: ${jHpPercent}%"></div>
                    </div>
                    <small style="font-size: 0.7em;">HP: ${hofnarr.hp}/${hofnarr.max_hp}</small>
                </div>
            `;
        } else if (hofnarr.active && hofnarr.hp <= 0) {
            jesterHtml = `<div style="color: var(--header-color); font-size: 0.7em; margin-top: 5px;">💀 Pippin wurde besiegt.</div>`;
        }

        const details = ebenenDetails[lastEbene] || { name: `Ebene ${lastEbene}`, icon: "🏰" };
        progressDiv.innerHTML = `
            <h3 style="margin:0; font-size: 1.1em; color:var(--accent-color);">${details.icon} ${details.name.toUpperCase()}</h3>
            <div style="margin-top:5px; font-family: 'Cinzel', serif; font-size: 0.9em;">📍 Raum: ${lastRaum} / ${lastMax}</div>
            <div class="progress-bar" style="margin-top: 8px; height: 8px; background-color: rgba(0,0,0,0.4); border: 1px solid var(--border-color);">
                <div class="progress-fill ${completeClass}" style="width: ${progressPercent}%; background: linear-gradient(to right, #d4af37, #f2c057); box-shadow: 0 0 5px rgba(212, 175, 55, 0.5); transition: width 0.5s ease-in-out;"></div>
            </div>`;
    }

    helden.forEach((h, i) => {
        const card = document.getElementById(`player${i+1}-card`);
        const statusDiv = document.getElementById(`p${i+1}-status`);
        
        if (statusDiv && card) {
            const materialien = h.inventar.filter(item => item.typ === "Material");
            const sonstigeItems = h.inventar.filter(item => item.typ !== "Material");

            // Materialien gruppieren (mit Tooltips)
            const matMap = {};
            materialien.forEach(m => {
                if (!matMap[m.name]) matMap[m.name] = { count: 0, item: m };
                matMap[m.name].count++;
            });
            const materialListe = Object.entries(matMap).length > 0 
                ? Object.entries(matMap).map(([name, data]) => {
                    const desc = formatItemDesc(data.item);
                    return `<span class="inventory-material tooltip">${data.count > 1 ? data.count + 'x ' : ''}${name}<span class="tooltiptext"><strong>${name}</strong><br>${desc}</span></span>`;
                }).join(", ") 
                : "keine";
            
            // Sonstige Gegenstände gruppieren (mit Tooltips)
            const itemMap = {};
            sonstigeItems.forEach(it => {
                const key = `${it.name}_${it.typ}_${it.wert}_${it.ladungen || 5}`;
                if (!itemMap[key]) itemMap[key] = { count: 0, item: it };
                itemMap[key].count++;
            });
            const inventarListe = Object.entries(itemMap).length > 0 
                ? Object.entries(itemMap).map(([key, data]) => {
                    const desc = formatItemDesc(data.item);
                    const ladungenInfo = data.item.ladungen !== undefined ? ` (${data.item.ladungen})` : "";
                    return `<span class="tooltip">${data.count > 1 ? data.count + 'x ' : ''}${data.item.name}${ladungenInfo}<span class="tooltiptext"><strong>${data.item.name}</strong><br>${desc}</span></span>`;
                }).join(", ") 
                : "leer";
            
            // Fähigkeiten mit Tooltips gruppieren
            const abilityListe = h.abilities.map(ab => {
                const desc = formatAbilityDesc(ab, h);
                return `<span class="tooltip">${ab.name}<span class="tooltiptext"><strong>${ab.name}</strong><br>${desc}</span></span>`;
            }).join(", ") || "keine";
            
            const achievementListe = h.achievements.length > 0 
                ? h.achievements.map(ach => `<span class="rare-item">${ach}</span>`).join(", ") 
                : "keine";

            const questListe = h.activeQuests.length > 0 
                ? h.activeQuests.map(q => {
                    let current = q.progress || 0;
                    // Für Sammel-Quests den aktuellen Inventar-Stand prüfen
                    if (q.item) {
                        current = h.inventar.filter(it => it.name === q.item).length;
                    }
                    const goal = q.goal || 1;
                    return `<span class="tooltip">${q.title} (${current}/${goal})<span class="tooltiptext"><strong>${q.title}</strong><br>${q.desc}</span></span>`;
                }).join(", ") 
                : "keine";

            const ausruestung = [
                h.ausgeruestete_waffe?.name,
                h.ausgeruestete_ruestung?.name,
                h.ausgeruestete_schild?.name
            ].filter(Boolean).join(", ") || "keine";

            const hpPercent = Math.max(0, Math.min(100, (h.hp / h.max_hp) * 100));
            const apPercent = Math.max(0, Math.min(100, (h.ap / h.max_ap) * 100));
            const spPercent = Math.max(0, Math.min(100, (h.sp / h.max_sp) * 100));
            const xpPercent = Math.max(0, Math.min(100, (h.xp / h.xp_needed) * 100));

            if (hpPercent < 20 && h.hp > 0 && h.hp !== null) {
                card.classList.add('critical-hp');
                if (!h.isCriticalHpSoundPlayed) {
                    if (criticalHpSound) {
                        criticalHpSound.currentTime = 0;
                        criticalHpSound.play().catch(() => {}); // Catch falls Browser Autoplay blockt
                    }
                    h.isCriticalHpSoundPlayed = true;
                }
            } else {
                if (hpPercent >= 20 || h.hp <= 0) card.classList.remove('critical-hp');
                h.isCriticalHpSoundPlayed = false;
            }

            const hpVal = h.hp || 0;
            const apVal = h.ap || 0;
            const spVal = h.sp || 0;

            const klasseLower = h.klasse.toLowerCase();
            const isCrafter = ["tueftler", "alchemist"].includes(klasseLower);
            
            let resourceHtml = "";
            if (isCrafter) {
                // Zähle hergestellte Gegenstände (Spezial) und Tränke im Inventar
                const spezialItems = h.inventar.filter(it => it.typ === "Spezial" || it.typ === "Trank").length;
                const resourceName = klasseLower === "tueftler" ? "Gadgets" : "Elixiere";
                resourceHtml = `
                    <div class="bar-container">
                        <small>🧪 ${resourceName}: ${spezialItems} (bereit)</small>
                        <div class="progress-bar"><div class="progress-fill ap-fill" style="width: 100%; opacity: 0.6; filter: hue-rotate(90deg);"></div></div>
                    </div>`;
            } else {
                resourceHtml = `
                    <div class="bar-container">
                        <small>✨ AP: ${apVal}/${h.max_ap}</small>
                        <div class="progress-bar"><div class="progress-fill ap-fill" style="width: ${apPercent}%"></div></div>
                    </div>`;
            }

            // Spieler-Buffs sammeln
            let playerStatusHtml = "";
            const pEffects = [];
            if (h.hatBardenBuff) pEffects.push(`<div class="status-badge badge-buff" title="Barden-Segen: +5 HP, +1 ATK, +10% Gold">🎵 Buff</div>`);
            if (h.bardenLichtDauer > 0) pEffects.push(`<div class="status-badge badge-buff" title="Magisches Licht: Erhellt dunkle Orte (${h.bardenLichtDauer} R.)">🌟 Licht</div>`);
            if (h.heilerLichtDauer > 0) pEffects.push(`<div class="status-badge badge-buff" title="Heiliges Leuchten: Erhellt dunkle Orte (${h.heilerLichtDauer} R.)">✨ Licht</div>`);
            if (h.hasGedankenschaerfe) pEffects.push(`<div class="status-badge badge-buff" title="Gedankenschärfe: Chance auf AP-Rückerstattung bei Intelligenz-Zaubern">🧠 Gedankenschärfe</div>`);
            if (h.tavernBanRooms > 0) pEffects.push(`<div class="status-badge badge-debuff" title="Hausverbot: Der Wirt lässt dich nicht rein (Noch ${h.tavernBanRooms} Räume)">🚫 Verbannt</div>`);
            
            h.achievements.forEach(ach => {
                pEffects.push(`<div class="status-badge badge-achievement" title="Errungenschaft: ${ach}">🏆 ${ach}</div>`);
            });

            if (pEffects.length > 0) playerStatusHtml = `<div class="status-container">${pEffects.join("")}</div>`;

            statusDiv.innerHTML = `
                <strong>${h.name}</strong> 
                ${rassenIcons[h.rasse.toLowerCase()] || '❓'} ${klassenIcons[h.klasse.toLowerCase()] || '❓'} 
                - <span class="rare-item">Lvl ${h.level}</span><br>
                ${playerStatusHtml}
                💰 Gold: ${h.gold} | ⚔️ ATK: ${h.atk_bonus}<br>
                <div class="bar-container">
                    <small>❤️ HP: ${hpVal}/${h.max_hp}</small>
                    <div class="progress-bar"><div class="progress-fill hp-fill" style="width: ${hpPercent}%"></div></div>
                </div>
                ${resourceHtml}
                <div class="bar-container">
                    <small>⚡ SP (Ultimate): ${spVal}/${h.max_sp}</small>
                    <div class="progress-bar"><div class="progress-fill sp-fill" style="width: ${spPercent}%"></div></div>
                </div>
                <div class="bar-container">
                    <small>🌟 XP: ${h.xp}/${h.xp_needed}${xpPercent >= 100 ? ' <span class="rare-item">🆙 BEREIT!</span>' : ''}</small>
                    <div class="progress-bar"><div class="progress-fill xp-fill ${xpPercent >= 100 ? 'progress-complete' : ''}" style="width: ${xpPercent}%"></div></div>
                </div>
                🛡️ RK: ${h.ruestung_klasse()}<br>
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 5px 0;">
                <div style="font-size: 0.85em;">
                    <strong>Erfolge:</strong> ${achievementListe}<br>
                    <strong>Fähigkeiten:</strong> ${abilityListe}<br>
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

    // Zeige Monster-UI auch bei 0 HP an, damit der "Todesstoß"-Schaden sichtbar ist
    if (monsterUi && monster && monster.hp >= 0 && monsterNameDiv && monsterStatsDiv) {
        monsterUi.style.display = 'block';
        monsterNameDiv.textContent = `👾 ${monster.name}`;
        const monsterHpPercent = monster.max_hp > 0 ? Math.max(0, Math.min(100, (monster.hp / monster.max_hp) * 100)) : 0;
        const damageText = monster.lastDmg > 0 ? `<span class="effect-lifesteal"> (-${monster.lastDmg})</span>` : "";

        // Resistenzen verarbeiten
        const resEntries = Object.entries(monster.resistenzen || {});
        let resHtml = "";
        if (resEntries.length > 0) {
            const list = resEntries.map(([element, mult]) => {
                // mult < 1 bedeutet Resistenz (grün), mult > 1 bedeutet Schwäche (rot)
                const color = mult < 1 ? "#2ecc71" : "#e74c3c"; 
                return `<span style="color: ${color}; font-weight: bold;">${element}</span>`;
            }).join(", ");
            resHtml = `<div style="font-size: 0.8em; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">🧬 Effekte: ${list}</div>`;
        }

    // Status-Effekte (Buffs/De-Buffs) verarbeiten
    let statusHtml = "";
    if (monsterStatus) {
        const effects = [];
        if (monsterStatus.schlaf > 0) effects.push(`<div class="status-badge badge-debuff" title="Schlaf: Monster setzt aus">💤 ${monsterStatus.schlaf}</div>`);
        if (monsterStatus.verwirrt > 0) effects.push(`<div class="status-badge badge-debuff" title="Verwirrt: Chance auf Selbstschaden">🌀 ${monsterStatus.verwirrt}</div>`);
        
        if (effects.length > 0) {
            statusHtml = `<div class="status-container">${effects.join("")}</div>`;
        }
    }

        monsterStatsDiv.innerHTML = `
            <div class="bar-container">
                <small>❤️ HP: ${Math.max(0, monster.hp)}/${monster.max_hp}${damageText} | ⚔️ ATK: ${monster.atk} | 🛡️ RK: ${monster.rk}</small>
                <div class="progress-bar"><div class="progress-fill hp-fill" style="width: ${monsterHpPercent}%"></div></div>
            ${statusHtml}
                ${resHtml}
            </div>
        `;
    } else if (monsterUi) {
        monsterUi.style.display = 'none';
    }
}