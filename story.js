const Item = require('./item');
const { printSlow, question, wuerfelD20, randomRange } = require('./utils');

const SHOP_WAREN = {
    "1": { label: "Heiltrank kaufen (5 Gold)", cost: 5, type: "traenke" },
    "2": { label: "Stahlschwert kaufen (25 Gold, +8 Schaden)", cost: 25, type: "item", name: "Stahlschwert", kind: "Waffe", val: 8 },
    "3": { label: "Schuppenpanzer kaufen (25 Gold, RK 15)", cost: 25, type: "item", name: "Schuppenpanzer", kind: "Ruestung", val: 15 },
    "4": { label: "Gifttrank kaufen (5 Gold)", cost: 5, type: "item", name: "Gifttrank", kind: "Trank", val: 0 },
    // Tueftler Materialien
    "5": { label: "Mechanischeteile (1 Gold)", cost: 1, type: "item", name: "Mechanischeteile", kind: "Material", val: 0 },
    "6": { label: "Maschinenoel (1 Gold)", cost: 1, type: "item", name: "Maschinenoel", kind: "Material", val: 0 },
    "7": { label: "Schrauben und Muttern (1 Gold)", cost: 1, type: "item", name: "Schrauben und Muttern", kind: "Material", val: 0 },
    // Alchemist Materialien
    "8": { label: "Bestienteile (1 Gold)", cost: 1, type: "item", name: "Bestienteile", kind: "Material", val: 0 },
    "9": { label: "Pflanzenteile (1 Gold)", cost: 1, type: "item", name: "Pflanzenteile", kind: "Material", val: 0 },
    "10": { label: "Fläschchen (1 Gold)", cost: 1, type: "item", name: "Fläschchen", kind: "Material", val: 0 },
    // Waffen & Ausrüstung
    "13": { label: "Dager (6 Gold, + 3 Schaden)", cost: 6, type: "item", name: "Dager", kind: "Waffe", val: 3 },
    "14": { label: "Axt des Vernichters (20 Gold, + 8 Schaden)", cost: 20, type: "item", name: "Axt des Vernichters", kind: "Waffe", val: 8 },
    "15": { label: "Feuriger Zauberstab T2 (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Feuerstab T2", kind: "Waffe", val: 8 },
    "16": { label: "Blitzer (10 Gold, + 8 Schaden)", cost: 10, type: "item", name: "Blitzer", kind: "Waffe", val: 8 },
    // Heiler & Barde
    "18": { label: "Stab der Großen Heilung (12 Gold)", cost: 12, type: "item", name: "Heilerstab", kind: "Waffe", val: 2 },
    "21": { label: "Drehleier (15 Gold)", cost: 15, type: "item", name: "Drehleier", kind: "Instrument", val: 0 },
    "22": { label: "Laute der Schönheit (15 Gold)", cost: 15, type: "item", name: "Laute", kind: "Instrument", val: 0 },
    // Nahrung (Direkte HP Heilung)
    "26": { label: "Essensration (2 Gold, + 4 HP)", cost: 2, type: "hp", val: 4, name: "Essensration" },
    "27": { label: "Wasser (2 Gold, + 2 HP)", cost: 2, type: "hp", val: 2, name: "Wasser" },
    "28": { label: "BockBier (3 Gold, + 3 HP)", cost: 3, type: "hp", val: 3, name: "BockBier" },
    "29": { label: "Radler des Elfen (2 Gold, + 1 HP)", cost: 2, type: "hp", val: 1, name: "Radler" }
};

async function schatzFinden(helden) {
    await printSlow("\n--- RAUM 1: Die Kammer der Prüfungen ---");
    await printSlow("Ihr findet eine schwere Eisentruhe. Wer von euch versucht, sie zu knacken?");
    helden.forEach((h, i) => console.log(`${i + 1}. ${h.name}`));
    
    let index;
    while (true) {
        const wahl = await question(`Wahl (1-${helden.length}): `);
        index = parseInt(wahl) - 1;
        if (!isNaN(index) && index >= 0 && index < helden.length) break;
        console.log("Ungültige Wahl.");
    }
    const aktiver = helden[index];
    
    await printSlow(`${aktiver.name} tritt vor und würfelt...`);
    const wurf = wuerfelD20();
    await printSlow(`🎲 Wurf: ${wurf}`);
    if (wurf >= 10) {
        const schwert = new Item("Breitschwert", "Waffe", 10);
        const panzer = new Item("Ritterrüstung", "Ruestung", 16);
        const lederhelm = new Item("Lederhelm", "Ruestung", 3);
        const bronzeschwert = new Item("Bronzeschwert", "Waffe", 5);
        const kleinerSchild = new Item("Kleiner Schild", "Schild", 1);
        const magierrobe = new Item("Magierrobe", "Ruestung", 2);
        const kurzbogen = new Item("Kurzbogen", "Waffe", 4);
        const dolchAssassinen = new Item("Dolch des Assassinen", "Waffe", 6);
        const eisenstiefel = new Item("Eisenstiefel", "Ruestung", 4);
        const silberring = new Item("Silberring", "Schmuck", 5); // Wert in Gold
        const heiligerAnhaenger = new Item("Heiliger Anhänger", "Schmuck", 10); // Wert in Gold
        const kampfhammer = new Item("Kampfhammer", "Waffe", 7);
        const schuppenpanzer = new Item("Schuppenpanzer", "Ruestung", 10);
        const grosserSchild = new Item("Großer Schild", "Schild", 3);
        const zauberbuch = new Item("Zauberbuch", "Sonstiges", 15); // Wert in Gold
        const langschwert = new Item("Langschwert", "Waffe", 8);
        const plattenhandschuhe = new Item("Plattenhandschuhe", "Ruestung", 5);
        const runenamulett = new Item("Runenamulett", "Schmuck", 20); // Wert in Gold
        const kriegsaxt = new Item("Kriegsaxt", "Waffe", 9);
        const mithrilkette = new Item("Mithrilkette", "Ruestung", 12);

        const goldFund = randomRange(1, 50);
        aktiver.gold += goldFund;

        aktiver.inventar.push(schwert, panzer);
        aktiver.inventar.push(lederhelm, bronzeschwert, kleinerSchild, magierrobe, kurzbogen, dolchAssassinen, eisenstiefel, silberring, heiligerAnhaenger, kampfhammer, schuppenpanzer, grosserSchild, zauberbuch, langschwert, plattenhandschuhe, runenamulett, kriegsaxt, mithrilkette);
        
        if (aktiver.isKI) {
            aktiver.kiAutomatischAusruesten();
        }

        await printSlow(`💎 Erfolg! ${aktiver.name} findet ${goldFund} Gold und eine Vielzahl wertvoller Gegenstände für das Inventar!`);
    } else {
        await printSlow("💥 Eine Falle explodiert! Alle Spieler verlieren 5 HP.");
        helden.forEach(h => h.hp -= 5);
    }
}

async function shopBesuch(helden) {
    await printSlow("\n🏪 Ihr findet einen reisenden Händler im Dungon.");
    
    for (const held of helden) {
        let shopping = true;
        while (shopping) {
            console.log(`\n--- Händler: ${held.name} (Gold: ${held.gold}) ---`);
            
            Object.keys(SHOP_WAREN).forEach(id => {
                console.log(`${id}. ${SHOP_WAREN[id].label}`);
            });
            console.log("30. Shop verlassen");
            
            const wahl = await question("Deine Wahl: ");
            
            if (wahl === "30") {
                shopping = false;
            } else if (SHOP_WAREN[wahl]) {
                const ware = SHOP_WAREN[wahl];
                
                if (held.gold >= ware.cost) {
                    held.gold -= ware.cost;
                    
                    if (ware.type === "traenke") {
                        held.traenke += 1;
                        await printSlow(`🧪 ${held.name} kauft ${ware.name || "einen Heiltrank"}.`);
                    } else if (ware.type === "item") {
                        held.inventar.push(new Item(ware.name, ware.kind, ware.val));
                        await printSlow(`📦 ${held.name} kauft ${ware.name} (im Inventar).`);
                        if (held.isKI) held.kiAutomatischAusruesten();
                    } else if (ware.type === "hp") {
                        held.hp = Math.min(held.max_hp, held.hp + ware.val);
                        await printSlow(`🍎 ${held.name} nutzt ${ware.name} und regeneriert HP.`);
                    }
                } else {
                    await printSlow("❌ Nicht genug Gold!");
                }
            } else {
                await printSlow("❌ Ungültige Wahl!");
            }
        }
    }
}

async function tavernenBesuch(helden) {
    await printSlow("\n🍺 Ihr betretet die gemütliche Taverne 'Zum tanzenden JS-Bug'.");
    await printSlow("Die Gruppe ruht sich aus und regeneriert 10 HP.");
    helden.forEach(h => h.hp = Math.min(h.max_hp, h.hp + 10));
}

module.exports = {
    schatzFinden,
    shopBesuch,
    tavernenBesuch
};