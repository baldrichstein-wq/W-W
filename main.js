import Spieler from './spieler.js';
import Monster from './monster.js'; 
import * as Combat from './combat.js';
import { question, randomRange, printSlow, wuerfelD20, updateUI } from './utils.js';
import * as Story from './story.js';

// --- META LOGIC ---
function zeigeHallOfFame() {
    const modal = document.getElementById('hof-modal');
    const listContainer = document.getElementById('hof-list');
    const history = JSON.parse(localStorage.getItem('dungeon_history')) || [];
    
    listContainer.innerHTML = '';
    modal.style.display = 'block';

    if (history.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center;">Noch keine Legenden verzeichnet...</p>';
    } else {
        history.sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp));
        history.forEach((h, i) => {
            const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : "🥉");
            const entry = document.createElement('div');
            entry.className = 'hof-entry';
            entry.innerHTML = `
                <div>
                    <span style="font-size: 1.2em;">${medal} ${i + 1}.</span> 
                    <strong class="rare-item">${h.name}</strong> (${h.klasse})
                </div>
                <div style="text-align: right;">
                    Level ${h.level}<br><small>${h.datum}</small>
                </div>
            `;
            listContainer.appendChild(entry);
        });
    }
}

function resetChampion() {
    if (confirm("Möchtest du den gespeicherten Champion wirklich löschen? Der Weltenfresser wird als Endboss zurückkehren.")) {
        localStorage.removeItem('dungeon_champion');
        localStorage.removeItem('dungeon_history');
        console.log("\n♻️ Champion-Daten gelöscht. Der Dungeon wurde zurückgesetzt.");
    }
}

// Event Listener für Meta-Buttons
document.addEventListener('DOMContentLoaded', () => {
    const hofBtn = document.getElementById('hof-btn');
    const resetBtn = document.getElementById('reset-btn');
    const modal = document.getElementById('hof-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (hofBtn) hofBtn.addEventListener('click', zeigeHallOfFame);
    if (resetBtn) resetBtn.addEventListener('click', resetChampion);
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
});

// --- ENGINE ---
async function spielStarten() {
    // Hintergrundbild im Story-Feld setzen
    const logPanel = document.getElementById('log-panel');
    if (logPanel) logPanel.style.backgroundImage = "url('img/Dungon-Eingang.png')";

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
        if (!isNaN(numPlayers) && numPlayers >= 1 && numPlayers <= 4) break; 
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

    // Dynamische Erstellung der Spieler-Karten in der UI basierend auf der Teamgröße
    const statsPanel = document.getElementById('stats-panel');
    statsPanel.innerHTML = ''; // Vorherige Platzhalter leeren
    helden.forEach((h, i) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.id = `player${i+1}-card`;
        card.innerHTML = `
            <h3>${h.name}</h3>
            <div id="p${i+1}-status" class="status-text">Held wird bereitgemacht...</div>
        `;
        statsPanel.appendChild(card);
    });

    // Prüfe auf Klassensynergien, bevor das Abenteuer startet
    await Story.synergienPruefen(helden);

    await printSlow("\nIhr erreicht den düsteren Eingang des Dungeons. Ein Lagerfeuer knistert und ein fahrender Händler wartet auf Kundschaft.");
    
    let amEingang = true;
    while (amEingang) {
        updateUI(helden);
        console.log("\n--- DER DUNGEON-EINGANG ---");
        console.log("1. Letzte Vorbereitungen (Händler besuchen)");
        console.log("2. In die Tiefe hinabsteigen (Dungeon betreten)");
        console.log("3. Die Schwarze Tafel (Aufträge)");
        
        const wahl = await question("Was ist euer Plan? (1-3): ");
        if (wahl === "1") {
            await Story.shopBesuch(helden, true);
        } else if (wahl === "2") {
            amEingang = false;
        } else if (wahl === "3") {
            await Story.schwarzeTafel(helden);
        } else {
            console.log("Ungültige Wahl.");
        }
    }

    await printSlow("\nMit festem Griff um eure Waffen betretet ihr den Dungeon...");
    
    // Hintergrundbilder den Ebenen zuordnen
    const ebeneBilder = {
        1: "Dungon-Wald.png",
        2: "Dungon-Ruine.png",
        3: "Dungon-Friedhof.png",
        4: "Dungon-Kristal.png",
        5: "Dungon-Eis.png",
        6: "Dungon-Magma.png",
        7: "Dungon-Himmel.png",
        8: "Dungon-endboss.png"
    };

    for (let ebene = 1; ebene <= 8; ebene++) {
        // Hintergrundbild setzen
        if (ebeneBilder[ebene]) {
            if (logPanel) logPanel.style.backgroundImage = `url('img/${ebeneBilder[ebene]}')`;
        }

        if (ebene === 1) {
            await printSlow(`\n🌲 EBENE 1: Der flüsternde Wald 🌲`);
        } else if (ebene === 2) {
            await printSlow(`\n🏚️ EBENE 2: Die verfallenen Ruinen 🏚️`);
        } else if (ebene === 3) {
            await printSlow(`\n🪦 EBENE 3: Der vergessene Friedhof 🪦`);
        } else if (ebene === 4) {
            await printSlow(`\n💎 EBENE 4: Die strahlenden Kristallhöhlen 💎`);
        } else if (ebene === 5) {
            await printSlow(`\n❄️ EBENE 5: Die gefrorenen Einöden ❄️`);
        } else if (ebene === 6) {
            await printSlow(`\n🔥 EBENE 6: Die brodelnden Magmaflüsse 🔥`);
        } else if (ebene === 7) {
            await printSlow(`\n✨ EBENE 7: Die himmlischen Sphären ✨`);
        } else if (ebene === 8) {
            await printSlow(`\n🌋 EBENE 8: Der Thron des Weltenfressers 🌋`);
        } else {
            await printSlow(`\n🏰 EBENE ${ebene} 🏰`);
        }
        
        const raumAnzahl = (ebene === 8) ? 1 : randomRange(4, 10);

        for (let raum = 1; raum <= raumAnzahl; raum++) {
            updateUI(helden);
            await printSlow(`\n--- Ebene ${ebene} | Raum ${raum}/${raumAnzahl} ---`);

            if (ebene === 8) {
                await printSlow("Die Realität selbst scheint hier zu zerreißen. Vor euch liegt nur noch ein gewaltiger Abgrund, in dem das Ende aller Welten auf euch wartet...");
                continue;
            }

            const eventChance = Math.random();
            if (eventChance < 0.6) { // 60% Chance auf Kampf
                const monsterNamen = ebene === 1
                    ? ["Wildschwein", "Wald-Kobold", "Giftige Schlange", "Riesenspinne", "Irrlicht", "Baumgeist"]
                    : ebene === 2
                    ? ["Verrotteter Zombie", "Skelett-Bogenschütze", "Riesenratte", "Geist", "Gargoyle"]
                    : ebene === 3
                    ? ["Skelett-Wächter", "Wiedergänger", "Grabwurm", "Schatten", "Verfluchte Rüstung"]
                    : ebene === 4
                    ? ["Kristall-Elementar", "Splitter-Käfer", "Glas-Gargoyle", "Amethyst-Wächter", "Reflektions-Schatten"]
                    : ebene === 5
                    ? ["Eis-Elementar", "Schneewolf", "Frost-Wiedergänger", "Yeti", "Eissplitter-Spinne"]
                    : ebene === 6
                    ? ["Feuer-Salamander", "Magma-Schleim", "Aschen-Skelett", "Höllenhund", "Vulkan-Elementar"]
                    : ebene === 7
                    ? ["Himmelswächter", "Lichtgeist", "Seraphim", "Sternenkind", "Ätherischer Drache"]
                    : ["Skelettkrieger", "Dungeon-Schleim", "Kobold-Plünderer", "Riesenspinne", "Grabräuber"];
                
                const name = monsterNamen[randomRange(0, monsterNamen.length - 1)];
                let resistenzen = {};
                if (ebene === 1) resistenzen = { Feuer: 1.2 }; // Wald: leicht schwach gegen Feuer
                else if (ebene === 4) resistenzen = { Physisch: 0.8, Blitz: 1.2 }; // Kristall: resistent gegen Physisch, schwach gegen Blitz
                else if (ebene === 5) resistenzen = { Eis: 0.5, Feuer: 1.5 }; // Eis: resistent gegen Eis, schwach gegen Feuer
                else if (ebene === 6) resistenzen = { Feuer: 0.5, Eis: 1.5 }; // Magma: resistent gegen Feuer, schwach gegen Eis
                else if (ebene === 7) resistenzen = { Heilig: 0.5, Schatten: 1.5 }; // Himmel: resistent gegen Heilig, schwach gegen Schatten (falls Schatten-Elemente eingeführt werden)

                const monster = new Monster(
                    `${name} (Lvl ${ebene})`, 
                    20 + ebene * 8, 
                    2 + ebene, 
                    10 + Math.floor(ebene / 2), 
                    15 * ebene, 
                    10 * ebene,
                    resistenzen
                );
                if (!await Combat.teamKampf(helden, monster)) return; // Game Over Abbruch
            } else if (eventChance < 0.8) { // 20% Chance auf Schatz
                await Story.schatzFinden(helden);
                helden.forEach(h => h.hp = Math.max(1, h.hp)); // Truhen-Fallen fix
            } else if (eventChance < 0.95) { // 15% Chance auf Händler
                await Story.shopBesuch(helden);
            } else { // 5% Chance auf eine sichere Rast
                await Story.tavernenBesuch(helden);
            }

            updateUI(helden);
            if (raum < raumAnzahl) {
                const canCraft = helden.some(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
                const wahl = await question(canCraft ? "\n(C) Crafting oder (Enter) Weiter?" : "\nDrückt Enter, um tiefer in die Ebene vorzudringen...");
                if (canCraft && wahl.toLowerCase() === 'c') {
                    await Story.craftingMenue(helden);
                    updateUI(helden);
                    await question("\nDrückt nun Enter zum Weitergehen...");
                }
            }
        }
        
        // Mini-Boss Kampf am Ende der Ebene
        updateUI(helden);

        let targetMonster;
        if (ebene === 8) {
            const lastChampion = JSON.parse(localStorage.getItem('dungeon_champion'));
            
            if (lastChampion) {
                await printSlow(`\n🔥 Ein bekannter Schatten tritt aus der Dunkelheit... Es ist <span class="rare-item">${lastChampion.name}</span>, der ehemalige Champion!`);
                await printSlow(`"Ihr seid nicht würdig, meinen Thron zu besteigen! Ich werde eure Seelen dem Dungeon opfern!"`);
                await question("Drückt Enter, um gegen den gefallenen Helden anzutreten...");
                targetMonster = new Monster(`${lastChampion.name} (Gefallener Champion)`, 250 + (lastChampion.level * 5), 15 + lastChampion.level, 18, 1000, 2000);
                targetMonster.klasse = lastChampion.klasse; // Behält die Klasse für Spezialfähigkeiten
            } else {
                await printSlow("\n🔥 Der Weltenfresser materialisiert sich aus der Dunkelheit. Sein Blick allein lässt die Hoffnung schwinden...");
                await question("Drückt Enter, um das Schicksal der Welt zu entscheiden...");
                targetMonster = new Monster("Weltenfresser (BOSS)", 220, 14, 18, 500, 1000, { Feuer: 0.8, Eis: 0.8, Blitz: 0.8, Säure: 0.8, Gift: 0.8, Energie: 0.8, Physisch: 0.8, Heilig: 0.8, Schall: 0.8 }); // Resistent gegen alle Elemente
            }
        } else {
            await printSlow(`\n⚠️ Achtung! Der Wächter von Ebene ${ebene} stellt sich euch in den Weg!`);
            const miniBossNamen = ebene === 1
                ? ["Uralter Waldschrat", "Schattenritter", "Feuer-Elementar", "Untoter Hauptmann", "Gorgone", "Eisen-Golem", "Knochen-Drache"]
                : ebene === 2
                ? ["Rostiger Golem", "Skelett-König", "Geisterfürst"]
                : ebene === 3
                ? ["Banshee", "Grabfürst", "Lich-Lehrling"]
                : ebene === 4
                ? ["Diamant-Goliath", "Smaragd-Basilisk", "Prismatischer Konstrukt"]
                : ebene === 5
                ? ["Frost-Riese", "Eiskönigin", "Uraltes Mammut"]
                : ebene === 6
                ? ["Lavadrache-Jungtier", "Phönix-Wächter", "Feuerfürst"]
                : ebene === 7
                ? ["Erzengel", "Sternenwächter", "Himmlischer Richter"]
                : ["Schattenritter", "Feuer-Elementar", "Untoter Hauptmann", "Gorgone", "Eisen-Golem", "Knochen-Drache"];
            const miniName = miniBossNamen[(ebene - 1) % miniBossNamen.length];
            targetMonster = new Monster(
                `${miniName} (MINI-BOSS)`,
                40 + ebene * 15,
                4 + ebene,
                12 + Math.floor(ebene / 2),
                40 * ebene,
                30 * ebene,
                (ebene === 1) ? { Feuer: 1.2 } : // Wald: leicht schwach gegen Feuer
                (ebene === 4) ? { Physisch: 0.8, Blitz: 1.2 } : // Kristall: resistent gegen Physisch, schwach gegen Blitz
                (ebene === 5) ? { Eis: 0.5, Feuer: 1.5 } : // Eis: resistent gegen Eis, schwach gegen Feuer
                (ebene === 6) ? { Feuer: 0.5, Eis: 1.5 } : // Magma: resistent gegen Feuer, schwach gegen Eis
                (ebene === 7) ? { Heilig: 0.5, Schatten: 1.5 } : // Himmel: resistent gegen Heilig, schwach gegen Schatten
                {} // Standard: keine Resistenzen
            );
        }

        if (!await Combat.teamKampf(helden, targetMonster)) return; // Game Over Abbruch

        if (ebene === 8) {
            console.log("\n" + "★".repeat(50));
            await printSlow("🏆 SIEG! Der Thron des Dungeons wurde erobert!");
            
            // Ranking erstellen
            const sieger = [...helden].sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp));
            
            await printSlow("\n👑 DAS SIEGERTREPPCHEN 👑");
            for (let i = 0; i < sieger.length; i++) {
                const h = sieger[i];
                const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : "🥉");
                await printSlow(`${medal} Platz ${i+1}: <span class="rare-item">${h.name}</span> (Level ${h.level} ${h.klasse})`);
            }

            // Champion als nächsten Boss speichern
            const champion = sieger[0];
            localStorage.setItem('dungeon_champion', JSON.stringify({
                name: champion.name,
                level: champion.level,
                klasse: champion.klasse
            }));

            // In die dauerhafte Historie eintragen
            const history = JSON.parse(localStorage.getItem('dungeon_history')) || [];
            history.push({
                name: champion.name,
                level: champion.level,
                klasse: champion.klasse,
                xp: champion.xp,
                datum: new Date().toLocaleDateString()
            });
            localStorage.setItem('dungeon_history', JSON.stringify(history));

            await printSlow(`\n⚠️ Eine dunkle Macht ergreift Besitz von ${champion.name}... Er wird als nächster Wächter zurückkehren.`);
            await printSlow("\nDie restlichen Überlebenden verlassen den Dungeon durch das goldene Portal.");

            const namen = helden.length > 1 
                ? helden.slice(0, -1).map(h => h.name).join(", ") + " und " + helden[helden.length - 1].name 
                : helden[0].name;
            await printSlow(`${namen} werden als Retter des Reiches in die Geschichte eingehen!`);
            console.log("★".repeat(50));
            return; // Spiel erfolgreich beendet
        }

        await Story.bossLootGeben(helden);
        updateUI(helden);

        await printSlow(`\n🌟 Ebene ${ebene} abgeschlossen! Die Treppe nach unten ist frei.`);
        if (ebene < 8) {
            const canCraft = helden.some(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
            const wahl = await question(canCraft ? "\n(C) Crafting oder (Enter) Nächste Ebene?" : "\nDrückt Enter für die nächste Ebene...");
            if (canCraft && wahl.toLowerCase() === 'c') {
                await Story.craftingMenue(helden);
                updateUI(helden);
                await question("\nDrückt nun Enter für den Abstieg...");
            }
        }
    }
}

// Spiel starten
spielStarten();