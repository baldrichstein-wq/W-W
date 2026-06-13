const Item = require('./item');
const { printSlow, question, wuerfelD20 } = require('./utils');

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

module.exports = {
    schatzFinden,
    shopBesuch
};