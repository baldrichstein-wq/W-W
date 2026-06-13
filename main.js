const Spieler = require('./spieler');
const Monster = require('./monster');
const { rl, question, randomRange, printSlow, wuerfelD20 } = require('./utils');
const Story = require('./story');
const Combat = require('./combat');

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
        klassenListe.forEach((k, i) => process.stdout.write(`${i + 1}. ${k} | `));
        console.log("\n");
        
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

    await printSlow("\nEure Gruppe ist formiert! Das Abenteuer beginnt...");
    
    // Status anzeigen
    console.log("\n=== EUER TEAM ===");
    helden.forEach(h => h.zeige_status());
    await question("\nDrückt Enter zum Starten...");
    
    // Station 1: Truhe
    await Story.schatzFinden(helden);
    helden.forEach(h => h.hp = Math.max(1, h.hp));
        
    // Station 2: Erster Gruppenkampf
    console.log("\n=== STATUS ===");
    helden.forEach(h => h.zeige_status());
    await question("\nDrückt Enter, um den nächsten Raum zu betreten...");
    
    if (!await Combat.teamKampf(helden, new Monster("Höhlentroll", 35, 3, 12, 15, 30))) {
        rl.close();
        return;
    }

    // Shop-Besuch nach dem ersten Kampf
    await Story.shopBesuch(helden);

    // Station 3: Der Bosskampf
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

    rl.close();
}

// Spiel starten
spielStarten();