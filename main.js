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
        history.sort((a, b) => {
            const scoreA = (a.level || 0) * 1000 + (a.xp || 0);
            const scoreB = (b.level || 0) * 1000 + (b.xp || 0);
            return scoreB - scoreA;
        });
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
    const brightnessSlider = document.getElementById('bg-brightness');
    const gameLog = document.getElementById('game-log');

    if (hofBtn) hofBtn.addEventListener('click', zeigeHallOfFame);
    if (resetBtn) resetBtn.addEventListener('click', resetChampion);
    
    if (brightnessSlider && gameLog) {
        brightnessSlider.addEventListener('input', (e) => {
            const opacity = 1 - (e.target.value / 100);
            gameLog.style.backgroundColor = `rgba(15, 10, 5, ${opacity})`;
        });
    }

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
        
        console.log("\nVerfügbare Rassen:");
        const rassenString = rassenListe.map((r, i) => `${i + 1}. ${r}`).join(" | ");
        console.log(rassenString + "\n");
        
        const rasseWahl = await question("Wahl (Nummer): ");
        const rasseIndex = parseInt(rasseWahl) - 1;
        const rasse = (rasseIndex >= 0 && rasseIndex < rassenListe.length) 
            ? rassenListe[rasseIndex] 
            : "Mensch";
        
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
    let bardenLiedGespielt = false;
    while (amEingang) {
        updateUI(helden);
        console.log("\n--- DER DUNGEON-EINGANG ---");
        console.log("1. Letzte Vorbereitungen (Händler besuchen)");
        console.log("2. In die Tiefe hinabsteigen (Dungeon betreten)");
        console.log("3. Die Schwarze Tafel (Aufträge)");
        const canCraft = helden.some(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
        if (canCraft) console.log("4. Handwerken (Werkbank nutzen)");
        const hasBarde = helden.some(h => h.klasse.toLowerCase() === "barde");
        if (hasBarde && !bardenLiedGespielt) console.log("5. Ein Lied am Feuer spielen (Barden-Buff)");
        
        let promptMsg = "Was ist euer Plan? (1-3): ";
        if (canCraft && (hasBarde && !bardenLiedGespielt)) promptMsg = "Was ist euer Plan? (1-5): ";
        else if (canCraft || (hasBarde && !bardenLiedGespielt)) promptMsg = "Was ist euer Plan? (1-4): ";

        const wahl = await question(promptMsg);
        if (wahl === "1") {
            await Story.shopBesuch(helden);
        } else if (wahl === "2") {
            amEingang = false;
        } else if (wahl === "3") {
            await Story.schwarzeTafel(helden);
        } else if (wahl === "4" && canCraft) {
            await Story.craftingMenue(helden);
        } else if (wahl === "5" && hasBarde && !bardenLiedGespielt) {
            await Story.bardenLied(helden);
            bardenLiedGespielt = true;
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
        4: "Dungon-Sumpf.png",
        5: "Dungon-Pilz.png",
        6: "Dungon-Wasser.png",
        7: "Dungon-Labyrinth.png",
        8: "Dungon-Kristal.png",
        9: "Dungon-Eis.png",
        10: "Dungon-Magma.png",
        11: "Dungon-Hoelle.png",
        12: "Dungon-Himmel.png",
        13: "Dungon-Dunkelheit.png",
        14: "Dungon-endboss.png"
    };

    for (let ebene = 1; ebene <= 14; ebene++) {
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
        } else if (ebene === 13) {
            await printSlow(`\n🌑 EBENE 13: Die absolute Dunkelheit 🌑`);
        } else {
            await printSlow(`\n🏰 EBENE ${ebene} 🏰`);
        }
        
        // Die Labyrinthebene (7) generiert deutlich mehr Räume (15-25).
        // Der Endboss (14) hat nur einen Raum.
        const raumAnzahl = (ebene === 14) ? 1 : (ebene === 7 ? randomRange(15, 25) : randomRange(7, 15));

        let raetselMeisterErschienen = false;
        for (let raum = 1; raum <= raumAnzahl; raum++) {
            updateUI(helden, null, null, ebene, raum, raumAnzahl);
            await printSlow(`\n--- Ebene ${ebene} | Raum ${raum}/${raumAnzahl} ---`);

            const brauchtFackel = [3, 7, 13].includes(ebene);
            let imDunkeln = brauchtFackel;

            if (brauchtFackel) {
                // Erst prüfen, ob ein Barde magisches Licht aktiv hat
                const lichtBarde = helden.find(h => h.bardenLichtDauer > 0);
                if (lichtBarde) {
                    imDunkeln = false;
                    lichtBarde.bardenLichtDauer--;
                    if (lichtBarde.bardenLichtDauer <= 0) {
                        const ab = lichtBarde.abilities.find(a => a.name === "Lied des Lichts");
                        helden.forEach(h => h.atk_bonus -= (ab.licht_atk || 0));
                        await printSlow(`\n🎶 Das magische Licht von ${lichtBarde.name} ist verblasst. Eure Sinne trüben sich wieder.`);
                    }
                } else {
                    const lichtHeiler = helden.find(h => h.heilerLichtDauer > 0);
                    if (lichtHeiler) {
                        imDunkeln = false;
                        lichtHeiler.heilerLichtDauer--;
                        if (lichtHeiler.heilerLichtDauer <= 0) {
                            const ab = lichtHeiler.abilities.find(a => a.name === "Heiliges Leuchten");
                            helden.forEach(h => h.def_bonus -= (ab.licht_def || 0));
                            await printSlow(`\n✨ Das heilige Leuchten von ${lichtHeiler.name} erlischt. Der Schutz schwindet.`);
                        }
                    }
                }

                // Wenn kein magisches Licht, dann Fackel prüfen
                if (imDunkeln) {
                const fHalter = helden.find(h => h.inventar.some(it => it.name === "Fackel"));
                if (fHalter) {
                    imDunkeln = false;
                    const fIdx = fHalter.inventar.findIndex(it => it.name === "Fackel");
                    const f = fHalter.inventar[fIdx];
                    if (f.ladungen === undefined) f.ladungen = 5;
                    f.ladungen--;
                    if (f.ladungen <= 0) {
                        fHalter.inventar.splice(fIdx, 1);
                        await printSlow(`\n🔥 <span class='effect-lifesteal'>Die Fackel von ${fHalter.name} ist abgebrannt!</span>`);
                    } else if (f.ladungen === 1) {
                        await printSlow(`\n⚠️ Die Fackel von ${fHalter.name} beginnt bedenklich zu flackern...`);
                    }
                }
                }
            }

            if (ebene === 14) {
                await printSlow("Die Realität selbst scheint hier zu zerreißen. Vor euch liegt nur noch ein gewaltiger Abgrund, in dem das Ende aller Welten auf euch wartet...");
                continue;
            }

            // Spezial-Logik für Sackgassen in der Labyrinthebene (Ebene 7)
            const deadEndChance = (ebene === 7) ? 0.2 : 0; // 20% Chance auf eine Sackgasse
            const eventChance = Math.random();

            if (!raetselMeisterErschienen && ebene < 14 && raum < raumAnzahl && Math.random() < 0.2) {
                await Story.raetselMeisterBegegnung(helden);
                raetselMeisterErschienen = true;
            } else if (Math.random() < deadEndChance) {
                await printSlow("\n🚧 <span class='effect-lifesteal'>SACKGASSE!</span> Ihr biegt falsch ab und steht plötzlich vor einer massiven Mauer.");
                await printSlow("Aus den Ritzen des Mauerwerks bricht ein <span class='rare-item'>Elite-Labyrinth-Wächter</span> hervor!");

                const eliteMonster = new Monster(
                    `Elite-Labyrinth-Wächter (Lvl ${ebene}++)`,
                    Math.floor((20 + ebene * 8) * 1.5), // 50% mehr HP
                    (2 + ebene) + 3,                    // +3 ATK
                    (10 + Math.floor(ebene / 2)) + 2,   // +2 RK
                    25 * ebene * 2,                     // Mehr XP
                    20 * ebene * 2,                     // Mehr Gold
                    { Physisch: 0.7, Magie: 1.2 }       // Spezial-Resistenzen
                );

                if (!await Combat.teamKampf(helden, eliteMonster, imDunkeln)) return;
                await printSlow("Nach dem harten Kampf findet ihr mühsam den Weg zurück zum Hauptgang.");

                // Chance auf "Karte des Labyrinths"
                if (Math.random() < 0.25) { // 25% Chance
                    const lebendeHelden = helden.filter(h => h.hp > 0);
                    const finder = lebendeHelden[randomRange(0, lebendeHelden.length - 1)];
                    if (finder) {
                        await printSlow(`\n🗺️ <span class="rare-item">${finder.name} findet eine 'Karte des Labyrinths'!</span>`);
                        await printSlow("Die Karte zeigt einen direkten Weg durch die nächsten Gänge.");
                        
                        const roomsToSkip = 5;
                        const oldRaum = raum;
                        raum = Math.min(raumAnzahl, raum + roomsToSkip); // Überspringt 5 Räume, aber nicht über die Gesamtzahl hinaus
                        await printSlow(`Ihr überspringt ${raum - oldRaum} Räume und seid nun in Raum ${raum}/${raumAnzahl}.`);
                        updateUI(helden, null, null, ebene, raum, raumAnzahl); // UI aktualisieren, um übersprungene Räume anzuzeigen
                    }
                }
            } else if (eventChance < 0.7) { // 70% Chance auf Kampf
                // Heiliges Leuchten Abschreckung auf Ebene 3 (Friedhof)
                if (ebene === 3 && helden.some(h => h.heilerLichtDauer > 0) && Math.random() < 0.3) {
                    await printSlow("\n✨ <span class='hp-gain'>Die Untoten weichen zischend vor dem heiligen Licht zurück. Der Weg ist frei!</span>");
                    continue;
                }

                const monsterNamen = ebene === 1
                    ? ["Wildschwein", "Wald-Kobold", "Giftige Schlange", "Riesenspinne", "Irrlicht", "Baumgeist"]
                    : ebene === 2
                    ? ["Verrotteter Zombie", "Skelett-Bogenschütze", "Riesenratte", "Geist", "Gargoyle"]
                    : ebene === 3
                    ? ["Skelett-Wächter", "Wiedergänger", "Grabwurm", "Schatten", "Verfluchte Rüstung"]
                    : ebene === 4
                    ? ["Sumpf-Lurker", "Moder-Zombie", "Giftiger Schlamm", "Riesenkroko", "Sumpf-Irrlicht"]
                    : ebene === 5
                    ? ["Sporen-Wächter", "Gift-Champignon", "Myzel-Krieger", "Leuchtkäfer", "Parasit-Ranke"]
                    : ebene === 6
                    ? ["Wasser-Elementar", "Seekrieger", "Riesenkrake", "Sirene", "Tiefsee-Angler"]
                    : ebene === 7
                    ? ["Minotaurus-Wächter", "Labyrinth-Spinne", "Fallensteller", "Irrgarten-Geist"]
                    : ebene === 8
                    ? ["Kristall-Elementar", "Splitter-Käfer", "Glas-Gargoyle", "Amethyst-Wächter", "Reflektions-Schatten"]
                    : ebene === 9
                    ? ["Eis-Elementar", "Schneewolf", "Frost-Wiedergänger", "Yeti", "Eissplitter-Spinne"]
                    : ebene === 10
                    ? ["Feuer-Salamander", "Magma-Schleim", "Aschen-Skelett", "Höllenhund", "Vulkan-Elementar"]
                    : ebene === 11
                    ? ["Erzdämon", "Sukkubus", "Höllenhund", "Flammen-Teufel", "Gefallene Seele"]
                    : ebene === 12
                    ? ["Himmelswächter", "Lichtgeist", "Seraphim", "Sternenkind", "Ätherischer Drache"]
                    : ebene === 13
                    ? ["Schatten-Hülle", "Leeren-Geist", "Albtraum-Schrecken", "Dunkler Priester", "Uralte Finsternis"]
                    : ["Skelettkrieger", "Dungeon-Schleim", "Kobold-Plünderer", "Riesenspinne", "Grabräuber"];
                
                const name = monsterNamen[randomRange(0, monsterNamen.length - 1)];
                let resistenzen = {};
                if (ebene === 1) resistenzen = { Feuer: 1.2 }; // Wald: leicht schwach gegen Feuer
                else if (ebene === 4) resistenzen = { Gift: 0.5, Feuer: 1.5 }; // Sumpf: Gift-resistent, schwach gegen Feuer
                else if (ebene === 5) resistenzen = { Gift: 0.5, Physisch: 0.8 }; // Pilz: zäh, giftig
                else if (ebene === 6) resistenzen = { Feuer: 0.2, Blitz: 1.5 }; // Wasser: Feuer-resistent, schwach gegen Blitz
                else if (ebene === 11) resistenzen = { Feuer: 0.1, Heilig: 2.0, Eis: 1.5 }; // Hölle: Extrem Feuer-resistent, schwach gegen Heilig/Eis
                else if (ebene === 8) resistenzen = { Physisch: 0.8, Blitz: 1.2 }; // Kristall: resistent gegen Physisch, schwach gegen Blitz
                else if (ebene === 9) resistenzen = { Eis: 0.5, Feuer: 1.5 }; // Eis: resistent gegen Eis, schwach gegen Feuer
                else if (ebene === 10) resistenzen = { Feuer: 0.5, Eis: 1.5 }; // Magma: resistent gegen Feuer, schwach gegen Eis
                else if (ebene === 12) resistenzen = { Heilig: 0.5, Schatten: 1.5 }; // Himmel: resistent gegen Heilig, schwach gegen Schatten
                else if (ebene === 13) resistenzen = { Schatten: 0.1, Heilig: 1.8, Eis: 1.2 }; // Dunkelheit: Fast immun gegen Schatten, schwach gegen Heilig

                const monster = new Monster(
                    `${name} (Lvl ${ebene})`, 
                    20 + ebene * 8, 
                    2 + ebene, 
                    10 + Math.floor(ebene / 2), 
                    15 * ebene, 
                    10 * ebene,
                    resistenzen
                );
                if (!await Combat.teamKampf(helden, monster, imDunkeln)) return; // Game Over Abbruch
            } else { // 30% Chance auf Schatz
                if (Math.random() < 0.5) {
                    // Mimik-Chance auf der Labyrinth-Ebene (Ebene 7)
                    if (ebene === 7 && Math.random() < 0.35) {
                        await printSlow("\n📦 Ihr entdeckt eine prachtvolle Truhe in einer dunklen Ecke des Labyrinths.");
                        await printSlow("Doch als ihr die Hand nach dem Schloss ausstreckt, verwandelt sich das Holz in klebriges Fleisch und ein Maul voller Zähne schnappt zu! <span class='log-critical'>MIMIK-ALARM!</span>");
                        const mimic = new Monster("Labyrinth-Mimik", 110, 10 + ebene, 14, 250, 150, { Feuer: 1.5, Schatten: 0.5 });
                        if (!await Combat.teamKampf(helden, mimic, imDunkeln)) return;
                    } else {
                        await Story.schatzFinden(helden);
                        helden.forEach(h => h.hp = Math.max(1, h.hp)); // Truhen-Fallen fix
                    }
                } else {
                    await Story.feenBegegnung(helden);
                }
            }

            updateUI(helden, null, null, ebene, raum, raumAnzahl);
            if (raum < raumAnzahl) {
                let interaktion = true;
                while (interaktion) {
                    const canCraft = helden.some(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
                    const barde = helden.find(h => h.klasse.toLowerCase() === "barde" && h.abilities.some(a => a.name === "Lied des Lichts"));
                    const heiler = helden.find(h => h.klasse.toLowerCase() === "heiler" && h.abilities.some(a => a.name === "Heiliges Leuchten"));
                    
                    let msg = "\n";
                    if (canCraft) msg += "(C) Crafting | ";
                    if (barde) msg += "(L) Lied des Lichts | ";
                    if (heiler) msg += "(H) Heiliges Leuchten | ";
                    msg += "(V) Vorräte | (Enter) Weiter: ";

                    const wahl = (await question(msg)).toLowerCase();
                    
                    if (canCraft && wahl === 'c') {
                        await Story.craftingMenue(helden);
                    } else if (barde && wahl === 'l') {
                        const fähigkeit = barde.abilities.find(a => a.name === "Lied des Lichts");
                        if (barde.ap >= fähigkeit.ap_kosten) {
                            barde.ap -= fähigkeit.ap_kosten;
                            if (!barde.bardenLichtDauer || barde.bardenLichtDauer <= 0) {
                                helden.forEach(h => h.atk_bonus += (fähigkeit.licht_atk || 0));
                            }
                            barde.bardenLichtDauer = fähigkeit.licht;
                            await printSlow(`\n🌟 ${barde.name} spielt das Lied des Lichts! Ein magischer Glanz vertreibt die Dunkelheit und schärft eure Sinne.`);
                        } else {
                            await printSlow("\n❌ Der Barde ist zu erschöpft für dieses Lied.");
                        }
                    } else if (heiler && wahl === 'h') {
                        const fähigkeit = heiler.abilities.find(a => a.name === "Heiliges Leuchten");
                        if (heiler.ap >= fähigkeit.ap_kosten) {
                            heiler.ap -= fähigkeit.ap_kosten;
                            if (!heiler.heilerLichtDauer || heiler.heilerLichtDauer <= 0) {
                                helden.forEach(h => h.def_bonus += (fähigkeit.licht_def || 0));
                            }
                            heiler.heilerLichtDauer = fähigkeit.licht;
                            await printSlow(`\n✨ ${heiler.name} beschwört ein Heiliges Leuchten! Die Dunkelheit weicht und die Gruppe fühlt sich geschützt.`);
                        } else {
                            await printSlow("\n❌ Der Heiler hat nicht genug Energie für dieses Gebet.");
                        }
                    } else if (wahl === 'v') {
                        await Story.vorraeteNutzen(helden);
                    } else {
                        interaktion = false;
                    }
                    updateUI(helden, null, null, ebene, raum, raumAnzahl);
                }
            }
        }
        
        // Mini-Boss Kampf am Ende der Ebene
        await Story.tavernenBesuch(helden);
        updateUI(helden, null, null, ebene, "Wächter", "Boss");

        const brauchtFackelBoss = [3, 7, 13].includes(ebene);
        let imDunkelnBoss = brauchtFackelBoss;

        if (brauchtFackelBoss) {
            const lichtBardeBoss = helden.find(h => h.bardenLichtDauer > 0);
            if (lichtBardeBoss) {
                imDunkelnBoss = false;
                lichtBardeBoss.bardenLichtDauer--;
                if (lichtBardeBoss.bardenLichtDauer <= 0) {
                    const ab = lichtBardeBoss.abilities.find(a => a.name === "Lied des Lichts");
                    helden.forEach(h => h.atk_bonus -= (ab.licht_atk || 0));
                    await printSlow(`\n🎶 Das magische Licht von ${lichtBardeBoss.name} verlischt im ungünstigsten Moment!`);
                }
            } else {
                const fHalter = helden.find(h => h.inventar.some(it => it.name === "Fackel"));
                if (fHalter) {
                imDunkelnBoss = false;
                const fIdx = fHalter.inventar.findIndex(it => it.name === "Fackel");
                const f = fHalter.inventar[fIdx];
                if (f.ladungen === undefined) f.ladungen = 5;
                f.ladungen--;
                if (f.ladungen <= 0) {
                    fHalter.inventar.splice(fIdx, 1);
                    await printSlow(`\n🔥 <span class='effect-lifesteal'>Die Fackel erlischt während des Bosskampfs!</span>`);
                }
            }
            }
        }

        let targetMonster;
        if (ebene === 14) {
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
                ? ["Sumpf-Hydra", "Schlamm-König", "Uralter Aligator"]
                : ebene === 5
                ? ["Pilz-Mutter", "Sporen-Lord", "Riesen-Myzel"]
                : ebene === 6
                ? ["Leviathan", "Meeres-Gott", "Tiefsee-Hydra"]
                : ebene === 7
                ? ["Dädalus-Konstrukt", "Labyrinth-Fürst", "Uralter Minotaurus"]
                : ebene === 8
                ? ["Diamant-Goliath", "Smaragd-Basilisk", "Prismatischer Konstrukt"]
                : ebene === 9
                ? ["Frost-Riese", "Eiskönigin", "Uraltes Mammut"]
                : ebene === 10
                ? ["Lavadrache-Jungtier", "Phönix-Wächter", "Feuerfürst"]
                : ebene === 11
                ? ["Asmodäus", "Beelzebub", "Höllen-General"]
                : ebene === 12
                ? ["Erzengel", "Sternenwächter", "Himmlischer Richter"]
                : ebene === 13
                ? ["Fürst der Schatten", "Ewiger Verderber", "Auge des Abgrunds"]
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
                (ebene === 13) ? { Schatten: 0, Heilig: 2.5 } : // Dunkelheit: Schatten-Immunität, extreme Heil-Schwäche
                {} // Standard: keine Resistenzen
            );
        }

        if (!await Combat.teamKampf(helden, targetMonster, imDunkelnBoss)) return; // Game Over Abbruch

        // Barden-Buff Entfernung nach Ebene 1
        if (ebene === 1 && bardenLiedGespielt) {
            helden.forEach(h => {
                if (h.hatBardenBuff) {
                    h.max_hp -= 5;
                    h.hp = Math.min(h.hp, h.max_hp);
                    h.atk_bonus -= 1;
                    delete h.hatBardenBuff;
                }
            });
            await printSlow("\n🎶 Der Nachhall des Bardenliedes verblasst... Der Buff ist abgelaufen.");
        }

        if (ebene === 14) {
            // --- SECRET EBENE LOGIK ---
            const hatSiegel = helden.some(h => h.inventar.some(it => it.name === "Goldener Siegelring"));
            
            if (hatSiegel) {
                await printSlow("\n✨ Der Goldene Siegelring in eurem Besitz beginnt gleißend hell zu leuchten!");
                await printSlow("Hinter dem Thron öffnet sich ein instabiler Riss in der Luft. Ein Portal in eine Secret Ebene!");
                const portalWahl = await question("Wollt ihr das Portal betreten und das letzte Rätsel wagen? (ja/nein): ");
                
                if (portalWahl.toLowerCase().trim() === "ja") {
                    const geloest = await Story.raetselPhase();
                    if (geloest) {
                        await Story.secretEbeneIntro();
                        const secretBoss = new Monster("Leeren-Wächter", 400, 20, 20, 2000, 5000, { Energie: 1.5, Physisch: 0.5 });
                        if (!await Combat.teamKampf(helden, secretBoss, false)) return; // In der Leere braucht man keine Fackel (eigenes Licht)
                        await printSlow(`\n🌟 <span class="rare-item">UNGLAUBLICH! Ihr habt das wahre Ende des Dungeons bezwungen!</span>`);

                        // --- DER ROSA ORK EVENT ---
                        await printSlow("\nPlötzlich raschelt es in einer dunklen Ecke der Leere. Ein kräftiger Ork tritt hervor, der einen großen Eimer mit leuchtend rosa Farbe bei sich trägt.");
                        await printSlow(`Ork: "Ihr habt mich gefunden, das wird nie wieder passieren!"`);
                        await printSlow("\nMit einer entschlossenen Geste schüttet er sich den Eimer rosa Farbe über den Kopf. Er trieft nun von oben bis unten in hellem Pink.");
                        await printSlow(`Ork: "Jetzt bin ich unsichtbar, ihr könnt mich nicht mehr sehen!"`);
                        await printSlow("\nDer Ork schleicht (extrem auffällig) davon und verschwindet im Nebel der Dimension.");
                    }
                }
            }

            await printSlow("\n✨ Ein gleißendes Portal öffnet sich und zieht euch zurück in die Welt des Lichts...");
            await question("Drückt Enter, um zur Siegerehrung zu gelangen...");

            console.log("\n" + "★".repeat(50));
            await printSlow("🏆 SIEG! Der Thron des Dungeons wurde erobert!");
            
            // Ranking erstellen
            // Der Sieger ist derjenige mit dem besten Verhältnis aus ausgeteiltem und erlittenem Schaden
            const sieger = [...helden].sort((a, b) => 
                (b.totalDamageDealt - b.totalDamageTaken) - (a.totalDamageDealt - a.totalDamageTaken)
            );
            
            await printSlow("\n👑 DAS SIEGERTREPPCHEN 👑");
            for (let i = 0; i < sieger.length; i++) {
                const h = sieger[i];
                const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : "🥉");
                await printSlow(`${medal} Platz ${i+1}: <span class="rare-item">${h.name}</span> (Level ${h.level})`);
                await printSlow(`   ⚔️ Schaden Ausgeteilt: ${h.totalDamageDealt} | 🩸 Schaden Erlitten: ${h.totalDamageTaken}`);
                
                // Höchste Schadensquelle finden
                let maxSource = "Keine";
                let maxDmg = 0;
                for (const [source, dmg] of Object.entries(h.damageSources)) {
                    if (dmg > maxDmg) { maxDmg = dmg; maxSource = source; }
                }
                if (maxDmg > 0) await printSlow(`   💀 Meiste Pein durch: ${maxSource} (${maxDmg} Dmg)`);

                // Achievement: Unantastbar (0 erlittener Schaden über das gesamte Spiel)
                if (h.totalDamageTaken === 0) {
                    await printSlow(`   ✨ <span class="hp-gain">🏆 ERRUNGENSCHAFT: UNANTASTBAR!</span> (${h.name} hat das gesamte Abenteuer ohne einen einzigen Kratzer überstanden!)`);
                }

                // Achievement: Pazifist (Weniger als 100 Schaden ausgeteilt)
                if (h.totalDamageDealt < 100) {
                    await printSlow(`   🕊️ <span class="hp-gain">🏆 ERRUNGENSCHAFT: PAZIFIST!</span> (${h.name} hat den Sieg mit minimaler Gewalt errungen!)`);
                }
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
        await Story.shopBesuch(helden, true);
        updateUI(helden, null, null, ebene, "Sieg", "✓");

        await printSlow(`\n🌟 Ebene ${ebene} abgeschlossen! Die Treppe nach unten ist frei.`);
        if (ebene < 14) {
            let interaktion = true;
            while (interaktion) {
                const canCraft = helden.some(h => ["tueftler", "alchemist"].includes(h.klasse.toLowerCase()));
                const msg = canCraft ? "\n(C) Crafting | (V) Vorräte | (Enter) Nächste Ebene: " : "\n(V) Vorräte nutzen | (Enter) Nächste Ebene: ";
                const wahl = (await question(msg)).toLowerCase();
                
                if (canCraft && wahl === 'c') {
                    await Story.craftingMenue(helden);
                } else if (wahl === 'v') {
                    await Story.vorraeteNutzen(helden);
                } else {
                    interaktion = false;
                }
                updateUI(helden, null, null, ebene, "Vorbereitung", "Abstieg");
            }
        }
    }
}

// Spiel starten
document.addEventListener('DOMContentLoaded', () => {
    spielStarten().catch(err => console.error("Kritischer Fehler beim Spielstart:", err));
});