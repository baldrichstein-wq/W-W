const readline = require('readline');
const Item = require('./item');
const Spieler = require('./spieler');
const Monster = require('./monster');

// Interface für Terminal-Eingaben einrichten
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hilfsfunktion für Zufallszahlen (inklusive min und max)
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function printSlow(text) {
    for (const char of text) {
        process.stdout.write(char);
        await sleep(15); // Etwas schneller, damit es flüssig bleibt
    }
    console.log();
}

function wuerfelD20() {
    return randomRange(1, 20);
}

// --- SPIELER-ZUG IN KÄMPFEN ---
async function spielerZug(spieler, monster_name, monster_hp) {
    while (true) {
        console.log(`\n🎮 [ZUG VON ${spieler.name.toUpperCase()}] (${spieler.hp}/${spieler.max_hp} HP)`);
        console.log("1. Angreifen");
        console.log("2. Heiltrank nutzen");
        console.log("3. Ausrüstung wechseln");
        const wahl = await question("Was tust du? (1/2/3): ");
        
        if (wahl === "1") {
            const wurf = wuerfelD20();
            const gesamt_angriff = wurf + spieler.atk_bonus;
            await printSlow(`🎲 Würfel: ${wurf} (+${spieler.atk_bonus}) = ${gesamt_angriff} gegen RK des Monsters.`);
            return ["angriff", gesamt_angriff];
            
        } else if (wahl === "2") {
            if (spieler.traenke > 0) {
                spieler.traenke -= 1;
                const heilung = randomRange(8, 18);
                spieler.hp = Math.min(spieler.max_hp, spieler.hp + heilung);
                await printSlow(`🧪 ${spieler.name} trinkt einen Trank. +${heilung} HP!`);
                return ["heilung", 0];
            } else {
                await printSlow("Keine Tränke mehr!");
            }
                
        } else if (wahl === "3") {
            if (spieler.inventar.length === 0) {
                await printSlow("Dein Inventar ist leer.");
                continue;
            }
            spieler.inventar.forEach((item, i) => {
                console.log(`${i + 1}. ${item.name} (${item.typ}: ${item.wert})`);
            });
            const inv_wahl = await question("Nummer wählen oder 0 für zurück: ");
            const idx = parseInt(inv_wahl) - 1;
            
            if (!isNaN(idx) && idx >= 0 && idx < spieler.inventar.length) {
                const item = spieler.inventar.splice(idx, 1)[0];
                if (item.typ === "Waffe") {
                    if (spieler.ausgeruestete_waffe) spieler.inventar.push(spieler.ausgeruestete_waffe);
                    spieler.ausgeruestete_waffe = item;
                } else if (item.typ === "Ruestung") {
                    if (spieler.ausgeruestete_ruestung) spieler.inventar.push(spieler.ausgeruestete_ruestung);
                    spieler.ausgeruestete_ruestung = item;
                } else if (item.typ === "Schild") {
                    if (spieler.ausgeruestete_schild) {
                        spieler.inventar.push(spieler.ausgeruestete_schild);
                    }
                    spieler.ausgeruestete_schild = item;
                }
                await printSlow(`🛡️ Gegenstand ${item.name} ausgerüstet!`);
                return ["ausruesten", 0];
            }
        }
    }
}

// --- GEMEINSAMES KAMPFSYSTEM ---
async function teamKampf(helden, monster) {
    await printSlow(`\n⚔️ Ein mächtiger ${monster.name} (HP: ${monster.hp} | RK: ${monster.rk}) blockiert den Weg!`);
    
    while (monster.hp > 0 && helden.some(h => h.hp > 0)) {
        // 1. Züge der Spieler
        for (const held of helden) {
            if (held.hp <= 0) continue; // Toten Spieler überspringen
                
            console.log(`\n--- Gegner: ${monster.name} (${monster.hp} HP) ---`);
            const [aktion, wert] = await spielerZug(held, monster.name, monster.hp);
            
            if (aktion === "angriff") {
                if (wert >= monster.rk) {
                    const waffen_schaden = held.ausgeruestete_waffe ? held.ausgeruestete_waffe.wert : 2;
                    const schaden = randomRange(1, waffen_schaden) + held.level;
                    monster.hp -= schaden;
                    await printSlow(`💥 Treffer! ${held.name} fügt dem ${monster.name} ${schaden} Schaden zu.`);
                } else {
                    await printSlow("❌ Verfehlt!");
                }
            }
                
            if (monster.hp <= 0) break;
        }
                
        // 2. Zug des Monsters (wenn es noch lebt)
        if (monster.hp > 0) {
            const lebende_helden = helden.filter(h => h.hp > 0);
            const ziel = lebende_helden[Math.floor(Math.random() * lebende_helden.length)];
            
            await printSlow(`\n👹 Der ${monster.name} holt aus und greift ${ziel.name} an!`);
            const monster_wurf = wuerfelD20() + monster.atk;
            
            if (monster_wurf >= ziel.ruestung_klasse()) {
                const schaden = randomRange(5, 12);
                ziel.hp = Math.max(0, ziel.hp - schaden);
                await printSlow(`🩸 ${ziel.name} wird getroffen und verliert ${schaden} HP!`);
                if (ziel.hp <= 0) {
                    await printSlow(`💀 ${ziel.name} ist bewusstlos zu Boden gegangen!`);
                }
            } else {
                await printSlow(`🛡️ ${ziel.name} blockt den Angriff erfolgreich ab!`);
            }
        }
    }
                
    // Kampf-Auswertung
    if (helden.some(h => h.hp > 0)) {
        await printSlow(`\n🎉 Sieg über den ${monster.name}! Jeder Held erhält ${monster.xp} XP und ${monster.gold} Gold.`);
        for (const held of helden) {
            if (held.hp > 0) {
                held.xp += monster.xp;
                held.gold += monster.gold;
                held.check_levelup();
            } else {
                held.hp = 1; // Gefallene Helden stehen mit 1 HP wieder auf
                held.gold += monster.gold;
                await printSlow(`🩹 ${held.name} wurde nach dem Kampf mit 1 HP wiederbelebt und erhält Beute.`);
            }
        }
        return true;
    } else {
        await printSlow("\n💀 Eure gesamte Gruppe wurde ausgelöscht... GAME OVER.");
        return false;
    }
}

// --- STORY-STATIONEN ---
async function schatzFinden(helden) {
    await printSlow("\n--- RAUM 1: Die Kammer der Prüfungen ---");
    await printSlow("Ihr findet eine schwere Eisentruhe. Wer von euch versucht, sie zu knacken?");
    console.log("1. Spieler 1");
    console.log("2. Spieler 2");
    const wahl = await question("Wahl (1/2): ");
    const aktiver = wahl === "1" ? helden[0] : helden[1];
    
    await printSlow(`${aktiver.name} tritt vor und würfelt...`);
    const wurf = wuerfelD20();
    await printSlow(`🎲 Wurf: ${wurf}`);
    if (wurf >= 10) {
        const schwert = new Item("Breitschwert", "Waffe", 10);
        const panzer = new Item("Ritterrüstung", "Ruestung", 16);
        aktiver.inventar.push(schwert, panzer);
        await printSlow(`💎 Erfolg! ${aktiver.name} findet ein Breitschwert und eine Ritterrüstung für das Inventar!`);
    } else {
        await printSlow("💥 Eine Falle explodiert! Beide Spieler verlieren 5 HP.");
        helden.forEach(h => h.hp -= 5);
    }
}

async function shopBesuch(helden) {
    await printSlow("\n🏪 Ihr findet einen reisenden Händler am Wegesrand.");
    
    for (const held of helden) {
        let shopping = true;
        while (shopping) {
            console.log(`\n--- Händler: ${held.name} (Gold: ${held.gold}) ---`);
            console.log("1. Heiltrank kaufen (10 Gold)");
            console.log("2. Stahlschwert kaufen (25 Gold, +8 Schaden)");
            console.log("3. Schuppenpanzer kaufen (25 Gold, RK 15)");
            console.log("4. Shop verlassen");
            
            const wahl = await question("Was möchtest du tun? (1/2/3/4): ");
            
            if (wahl === "1") {
                if (held.gold >= 10) {
                    held.gold -= 10;
                    held.traenke += 1;
                    await printSlow(`🧪 ${held.name} kauft einen Heiltrank.`);
                } else {
                    await printSlow("❌ Nicht genug Gold!");
                }
            } else if (wahl === "2") {
                if (held.gold >= 25) {
                    held.gold -= 25;
                    held.inventar.push(new Item("Stahlschwert", "Waffe", 8));
                    await printSlow(`⚔️ ${held.name} kauft ein Stahlschwert (im Inventar).`);
                } else {
                    await printSlow("❌ Nicht genug Gold!");
                }
            } else if (wahl === "3") {
                if (held.gold >= 25) {
                    held.gold -= 25;
                    held.inventar.push(new Item("Schuppenpanzer", "Ruestung", 15));
                    await printSlow(`🛡️ ${held.name} kauft einen Schuppenpanzer (im Inventar).`);
                } else {
                    await printSlow("❌ Nicht genug Gold!");
                }
            } else {
                shopping = false;
            }
        }
    }
}

// --- ENGINE ---
async function spielStarten() {
    console.log("=".repeat(50));
    console.log("   DUNGEONS & JAVASCRIPT: KOOP-EDITION (2 SPIELER)");
    console.log("=".repeat(50));
    
    const klassenListe = [
        "Krieger", "Magier", "Schurke", "Heiler", 
        "Verteidiger", "Tueftler", "Alchemist", "Barde"
    ];

    async function charakterErstellen(spielerNummer) {
        const name = await question(`Spieler ${spielerNummer} - Name deines Helden: `);
        const rasse = await question("Rasse (Mensch, Ork, Zwerg, Elf, Goblin): ");
        
        console.log("\nVerfügbare Klassen:");
        klassenListe.forEach((k, i) => process.stdout.write(`${i + 1}. ${k} | `));
        console.log("\n");
        
        const wahl = await question("Wahl (Nummer): ");
        const index = parseInt(wahl) - 1;
        const klasse = (index >= 0 && index < klassenListe.length) 
            ? klassenListe[index] 
            : "Schurke";
            
        return new Spieler(name, rasse, klasse);
    }

    // Charaktererstellung Spieler 1
    const p1 = await charakterErstellen(1);
    p1.traenke = 2;
    
    console.log("-".repeat(30));
    
    // Charaktererstellung Spieler 2
    const p2 = await charakterErstellen(2);
    p2.traenke = 2;
    
    const helden = [p1, p2];
    await printSlow("\nEure Gruppe ist formiert! Das Abenteuer beginnt...");
    
    // Status anzeigen
    console.log("\n=== EUER TEAM ===");
    p1.zeige_status();
    p2.zeige_status();
    await question("\nDrückt Enter zum Starten...");
    
    // Station 1: Truhe
    await schatzFinden(helden);
    helden.forEach(h => h.hp = Math.max(1, h.hp));
        
    // Station 2: Erster Gruppenkampf
    console.log("\n=== STATUS ===");
    p1.zeige_status();
    p2.zeige_status();
    await question("\nDrückt Enter, um den nächsten Raum zu betreten...");
    
    if (!await teamKampf(helden, new Monster("Höhlentroll", 35, 3, 12, 15, 30))) {
        rl.close();
        return;
    }

    // Shop-Besuch nach dem ersten Kampf
    await shopBesuch(helden);

    // Station 3: Der Bosskampf
    console.log("\n=== STATUS ===");
    p1.zeige_status();
    p2.zeige_status();
    await printSlow("\nIhr erreicht das Herz des Dungeons. Der Boden bebt...");
    await question("Drückt Enter, um dem Endboss gegenüberzutreten...");
    
    if (await teamKampf(helden, new Monster("Zwillings-Drache (BOSS)", 65, 5, 14, 40, 100))) {
        console.log("\n" + "★".repeat(50));
        await printSlow("🏆 SIEG! Ihr habt die Bestie gemeinsam bezwungen!");
        await printSlow(`${p1.name} und ${p2.name} kehren als gefeierte Helden in die Taverne zurück!`);
        console.log("★".repeat(50));
    }

    rl.close();
}

// Spiel starten
spielStarten();