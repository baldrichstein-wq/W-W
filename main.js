import Spieler from './spieler.js';
import Monster from './monster.js'; 
import * as Combat from './combat.js';
import { question, randomRange, printSlow, wuerfelD20 } from './utils.js';
import * as Story from './story.js';

const criticalHpSound = document.getElementById('critical-hp-sound');

function updateUI(helden) {
    helden.forEach((h, i) => {
        const card = document.getElementById(`player${i+1}-card`);
        const statusDiv = document.getElementById(`p${i+1}-status`);
        
        if (statusDiv && card) {
            const inventarListe = h.inventar.length > 0 
                ? h.inventar.map(item => item.name).join(", ") 
                : "leer";
            
            const ausruestung = [
                h.ausgeruestete_waffe?.name,
                h.ausgeruestete_ruestung?.name,
                h.ausgeruestete_schild?.name
            ].filter(Boolean).join(", ") || "keine";

            const hpPercent = Math.max(0, Math.min(100, (h.hp / h.max_hp) * 100));
            const apPercent = Math.max(0, Math.min(100, (h.ap / h.max_ap) * 100));

            // Visuelle Hervorhebung bei wenig HP (unter 20%, aber nicht tot)
            if (hpPercent < 20 && h.hp > 0) {
                card.classList.add('critical-hp');
                if (!h.isCriticalHpSoundPlayed) {
                    if (criticalHpSound) {
                        criticalHpSound.currentTime = 0; // Sound auf Anfang setzen
                        criticalHpSound.play();
                    }
                    h.isCriticalHpSoundPlayed = true;
                }
            } else {
                card.classList.remove('critical-hp');
                if (h.isCriticalHpSoundPlayed) {
                    if (criticalHpSound) {
                        criticalHpSound.pause();
                        criticalHpSound.currentTime = 0; // Sound zurücksetzen
                    }
                    h.isCriticalHpSoundPlayed = false;
                }
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
                🛡️ RK: ${h.ruestung_klasse()}<br>
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 5px 0;">
                <div style="font-size: 0.85em;">
                    <strong>Ausrüstung:</strong> ${ausruestung}<br>
                    <strong>Inventar:</strong> ${inventarListe}
                </div>
            `;
        }
    });
}

// --- ENGINE ---
async function spielStarten() {
    console.log("=".repeat(50));
    console.log("   DUNGEONS");
    console.log("=".repeat(50));

    const rassenListe = [
        "Mensch", "Ork", "Zwerg", "Elf", "Goblin"
    ];
    
    const klassenListe = [
        "Krieger", "Magier", "Schurke", "Heiler", 
        "Verteidiger", "Tueftler", "Alchemist", "Barde"
    ];

    async function charakterErstellen(spielerNummer) {
        const name = await question(`Spieler ${spielerNummer} - Name deines Helden: `);
        const rasse = await question("Rasse (Mensch, Ork, Zwerg, Elf, Goblin): ");
        
        console.log("\nVerfügbare Klassen:");
        const klassenString = klassenListe.map((k, i) => `${i + 1}. ${k}`).join(" | ");
        console.log(klassenString + "\n");
        
        const wahl = await question("Wahl (Nummer): ");
        const index = parseInt(wahl) - 1;
        const klasse = (index >= 0 && index < klassenListe.length) 
            ? klassenListe[index] 
            : "Schurke";
            
        return new Spieler(name, rasse, klasse);
    }

    // Spieleranzahl abfragen
    let numPlayers;
    while (true) {
        const input = await question("Wie viele Helden treten die Reise an? (1-4): ");
        numPlayers = parseInt(input);
        if (!isNaN(numPlayers) && numPlayers >= 1 && numPlayers <= 2) break; // Limit 2 wegen HTML-Struktur
        if (numPlayers > 2) console.log("Aktuell unterstützt die UI nur 2 Spieler.");
        console.log("Ungültige Eingabe. Bitte wähle eine Zahl zwischen 1 und 4.");
    }

    const helden = [];
    for (let i = 1; i <= numPlayers; i++) {
        const p = await charakterErstellen(i);
        p.traenke = 2;
        helden.push(p);
        console.log("-".repeat(30));
    }

    // KI-Gefährte hinzufügen, wenn nur 1 Spieler spielt
    if (numPlayers === 1) {
        const kiNamen = ["Bofur", "Xena", "Aragorn", "Gimli", "Legolas"];
        const kiName = kiNamen[randomRange(0, kiNamen.length - 1)] + " (KI)";
        const kiRasse = rassenListe[randomRange(0, rassenListe.length - 1)];
        const kiKlasse = klassenListe[randomRange(0, klassenListe.length - 1)];
        const kiGefaehrte = new Spieler(kiName, kiRasse, kiKlasse);
        kiGefaehrte.traenke = 2;
        kiGefaehrte.isKI = true; // Markierung für das Kampfsystem
        helden.push(kiGefaehrte);
        await printSlow(`\n🤖 Da du allein bist, schließt sich dir der KI-Gefährte ${kiName} an!`);
    }

    await printSlow("\nEure Gruppe ist formiert! Das Abenteuer beginnt...");
    
    // Status anzeigen
    console.log("\n=== EUER TEAM ===");
    helden.forEach(h => h.zeige_status());
    updateUI(helden);
    await question("\nDrückt Enter zum Starten...");
    
    // Station 1: Truhe
    await Story.schatzFinden(helden);
    helden.forEach(h => h.hp = Math.max(1, h.hp));
    updateUI(helden);
        
    // Station 2: Erster Gruppenkampf
    console.log("\n=== STATUS ===");
    updateUI(helden);
    helden.forEach(h => h.zeige_status());
    await question("\nDrückt Enter, um den nächsten Raum zu betreten...");
    
    if (!await Combat.teamKampf(helden, new Monster("Höhlentroll", 35, 3, 12, 15, 30))) return;
    updateUI(helden);

    // Shop-Besuch nach dem ersten Kampf
    await Story.shopBesuch(helden);
    updateUI(helden);

    // Station 3: Der Bosskampf
    updateUI(helden);
    console.log("\n=== STATUS ===");
    helden.forEach(h => h.zeige_status());
    await printSlow("\nIhr erreicht das Herz des Dungeons. Der Boden bebt...");
    await question("Drückt Enter, um dem Endboss gegenüberzutreten...");
    
    if (await Combat.teamKampf(helden, new Monster("Zwillings-Drache (BOSS)", 65, 5, 14, 40, 100))) {
        console.log("\n" + "★".repeat(50));
        await printSlow("🏆 SIEG! Ihr habt die Bestie gemeinsam bezwungen!");
        const namen = helden.length > 1 
            ? helden.slice(0, -1).map(h => h.name).join(", ") + " und " + helden[helden.length - 1].name 
            : helden[0].name;
        await printSlow(`${namen} kehren als gefeierte Helden in die Taverne zurück!`);
        console.log("★".repeat(50));
    }
}

// Spiel starten
spielStarten();