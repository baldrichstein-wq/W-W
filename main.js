const Spieler = require('./spieler');
const Monster = require('./monster');
const { rl, question, randomRange, printSlow, wuerfelD20 } = require('./utils');
const Story = require('./story');
const Combat = require('./combat');

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
    await Story.schatzFinden(helden);
    helden.forEach(h => h.hp = Math.max(1, h.hp));
        
    // Station 2: Erster Gruppenkampf
    console.log("\n=== STATUS ===");
    p1.zeige_status();
    p2.zeige_status();
    await question("\nDrückt Enter, um den nächsten Raum zu betreten...");
    
    if (!await Combat.teamKampf(helden, new Monster("Höhlentroll", 35, 3, 12, 15, 30))) {
        rl.close();
        return;
    }

    // Shop-Besuch nach dem ersten Kampf
    await Story.shopBesuch(helden);

    // Station 3: Der Bosskampf
    console.log("\n=== STATUS ===");
    p1.zeige_status();
    p2.zeige_status();
    await printSlow("\nIhr erreicht das Herz des Dungeons. Der Boden bebt...");
    await question("Drückt Enter, um dem Endboss gegenüberzutreten...");
    
    if (await Combat.teamKampf(helden, new Monster("Zwillings-Drache (BOSS)", 65, 5, 14, 40, 100))) {
        console.log("\n" + "★".repeat(50));
        await printSlow("🏆 SIEG! Ihr habt die Bestie gemeinsam bezwungen!");
        await printSlow(`${p1.name} und ${p2.name} kehren als gefeierte Helden in die Taverne zurück!`);
        console.log("★".repeat(50));
    }

    rl.close();
}

// Spiel starten
spielStarten();